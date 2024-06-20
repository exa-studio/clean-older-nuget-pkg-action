import * as core from '@actions/core'
import { PackageVersion } from './package_version'

export async function run(): Promise<void> {
  try {
    const packageUrl: string = core.getInput('organization-package-url')
    const gh_token: string = core.getInput('gh-token')

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
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
