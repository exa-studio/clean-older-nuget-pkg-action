import { PackageMetadata } from './package_metadata'

export interface PackageVersion {
  id: number
  name: string
  url: string
  package_html_url: string
  created_at: string
  updated_at: string
  html_url: string
  metadata: PackageMetadata
}
