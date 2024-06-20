import * as core from '@actions/core'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const packageUrl: string = core.getInput('organization-package-url')
    const gh_token: string = core.getInput('github-token')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Getting the organization package at ${packageUrl}`)
    let response = await fetch(packageUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${gh_token}`
      }
    }).then(response => {
      return response.json()
    })

    let versions: string[] = response.data.map((pkg: any) => pkg.name)
    core.debug(`Found versions: ${versions}`)

    // Set outputs for other workflow steps to use
    core.setOutput('versions', versions)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
