import * as core from '@actions/core'
import { PackageVersion } from './package_version'
import git, { DefaultLogFields, LogResult } from 'simple-git'

export async function run(): Promise<void> {
  try {
    const packageUrl: string = core.getInput('organization-package-url')
    const gh_token: string = core.getInput('gh-token')

    // core.debug(`Getting the organization package at ${packageUrl}`)
    // const response = await fetch(packageUrl, {
    //   method: 'GET',
    //   headers: {
    //     Authorization: `Bearer ${gh_token}`
    //   }
    // })

    // if (!response.ok) {
    //   throw new Error(`Failed to fetch package: ${response.statusText}`)
    // }
    // const res: PackageVersion[] = await response.json()

    // const versions: string[] = res.map((version: PackageVersion) => {
    //   return version.name
    // })
    // core.info(`Found ${versions.length} versions`)

    // // order versions by date

    // const sortedVersions: PackageVersion[] = [...res].sort((a, b) => {
    //   const dateA = new Date(a.created_at)
    //   const dateB = new Date(b.created_at)
    //   return dateA > dateB ? 1 : -1
    // })

    // // get the older version
    // const olderVersion = sortedVersions[0]
    // core.info(`Deleting version ${olderVersion.name} ... `)

    // //remove with github api the older version
    // const deleteResponse = await fetch(`${packageUrl}/${olderVersion.id}`, {
    //   method: 'DELETE',
    //   headers: {
    //     Authorization: `Bearer ${gh_token}`
    //   }
    // })

    // if (!deleteResponse.ok) {
    //   throw new Error(`Failed to delete package: ${deleteResponse.statusText}`)
    // }

    // core.info(`Deleted version ${olderVersion.name}`)
    // core.setOutput('versions', versions)

    const lastCommit: string | undefined = await (
      await git().log(['-1'])
    ).latest?.message

    if (lastCommit === undefined) {
      core.error('Failed to get last commit')
      throw new Error('Failed to get last commit')
    }
    core.info(`Last commit: ${lastCommit}`)

    let lastCommitType

    if (lastCommit.includes('breaking change') || lastCommit.includes('!')) {
      lastCommitType = 'major'
    } else if (lastCommit.includes('fix')) {
      lastCommitType = 'patch'
    } else if (lastCommit.includes('feat')) {
      lastCommitType = 'minor'
    } else {
      lastCommitType = 'noType'
    }

    core.info(`Last commit type: ${lastCommitType}`)

    switch (lastCommitType) {
      case 'major':
        addMajorVersion()
        break
      case 'minor':
        addMinorVersion()
        break
      case 'patch':
        addPatchVersion()
        break
      default:
        core.info('No version to add')
        break
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

const addMajorVersion = () => {
  core.info('Adding main version')
}

const addMinorVersion = () => {
  core.info('Adding mid version')
}

const addPatchVersion = () => {
  core.info('Adding patch version')
}
