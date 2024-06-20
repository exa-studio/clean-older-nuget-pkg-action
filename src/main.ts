import * as core from '@actions/core'
import { PackageVersion } from './package_version'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const packageUrl: string = core.getInput('organization-package-url')
    const gh_token: string = core.getInput('gh-token')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
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

    // Set outputs for other workflow steps to use
    core.setOutput('versions', versions)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
