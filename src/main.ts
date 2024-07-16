import * as core from '@actions/core'
import { PackageVersion } from './package_version'
import git from 'simple-git'
const path = require('path')
const fs = require('fs')

export async function run(): Promise<void> {
  try {
    const packageUrl: string = core.getInput('organization-package-url')
    const gh_token: string = core.getInput('gh-token')

    // get current version
    const csprojPath = path.join(process.cwd(), '/utils-library.csproj')
    core.info(`Reading .csproj file at ${csprojPath}`)
    const csprojContent = fs.readFileSync(csprojPath, 'utf8')
    const versionMatch = csprojContent.match(/<Version>(.*?)<\/Version>/)
    if (!versionMatch) {
      throw new Error('Version not found in .csproj file')
    }

    const currentVersion = versionMatch[1]
    core.info(`Current version: ${currentVersion}`)

    // get the last commit
    const lastCommit: string | undefined = await (
      await git().log(['-1'])
    ).latest?.message

    if (lastCommit === undefined) {
      core.error('Failed to get last commit')
      throw new Error('Failed to get last commit')
    }
    core.info(`Last commit: ${lastCommit}`)

    let lastCommitType

    //add version based on commit message
    if (lastCommit.includes('breaking change') || lastCommit.includes('!')) {
      lastCommitType = 'major'
    } else if (lastCommit.includes('fix')) {
      lastCommitType = 'patch'
    } else if (lastCommit.includes('feat')) {
      lastCommitType = 'minor'
    } else {
      lastCommitType = 'noType'
    }

    if (lastCommitType === 'noType') {
      core.info('No version to add')
      return
    }

    core.info(`Last commit type: ${lastCommitType}`)

    let newVersion: string = ''
    switch (lastCommitType) {
      case 'major':
        newVersion = addMajorVersion(currentVersion)
        break

      case 'minor':
        newVersion = addMinorVersion(currentVersion)
        break

      case 'patch':
        newVersion = addPatchVersion(currentVersion)
        break

      default:
        core.info('No version to add')
    }

    const updatedCsprojContent = csprojContent.replace(
      /<Version>(.*?)<\/Version>/,
      `<Version>${newVersion}</Version>`
    )

    fs.writeFileSync(csprojPath, updatedCsprojContent)

    await git().add(csprojPath)
    await git().commit(`chore: bump version to ${newVersion}`)
    await git().push()

    await removeOlderVersion(packageUrl, gh_token)
    core.info('Process completed')
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

const addMajorVersion = (currentVersion: string) => {
  let newVersion = currentVersion.replace(
    /(\d+)\.(\d+)\.(\d+)/,
    (match, major, minor, patch) => `${parseInt(major) + 1}.0.0`
  )
  core.info('Adding main version ' + newVersion)
  return newVersion
}

const addMinorVersion = (currentVersion: string) => {
  let newVersion = currentVersion.replace(
    /(\d+)\.(\d+)\.(\d+)/,
    (match, major, minor, patch) => `${major}.${parseInt(minor) + 1}.0`
  )
  core.info('Adding main version ' + newVersion)
  return newVersion
}

const addPatchVersion = (currentVersion: string) => {
  let newVersion = currentVersion.replace(
    /(\d+)\.(\d+)\.(\d+)/,
    (match, major, minor, patch) => `${major}.${minor}.${parseInt(patch) + 1}`
  )
  core.info('Adding main version ' + newVersion)
  return newVersion
}

const removeOlderVersion = async (packageUrl: string, gh_token: string) => {
  core.debug(`Getting the organization package at ${packageUrl}`)
  const response = await fetch(packageUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${gh_token}`
    }
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch package: ${response.statusText}`)
  }
  const res: PackageVersion[] = await response.json()
  const versions: string[] = res.map((version: PackageVersion) => {
    return version.name
  })
  core.info(`Found ${versions.length} versions`)
  // order versions by date
  const sortedVersions: PackageVersion[] = [...res].sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)
    return dateA > dateB ? 1 : -1
  })
  // get the older version
  const olderVersion = sortedVersions[0]
  core.info(`Deleting version ${olderVersion.name} ... `)
  //remove with github api the older version
  const deleteResponse = await fetch(`${packageUrl}/${olderVersion.id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${gh_token}`
    }
  })
  if (!deleteResponse.ok) {
    throw new Error(`Failed to delete package: ${deleteResponse.statusText}`)
  }
  core.info(`Deleted version ${olderVersion.name}`)
  core.setOutput('versions', versions)
}
