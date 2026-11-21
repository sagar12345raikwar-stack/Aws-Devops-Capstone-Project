terraform {
  backend "s3" {
    bucket       = "sagar-capstone-tfstate-2026"
    key          = "capstone/terraform.tfstate"
    region       = "ap-southeast-2"
    encrypt      = true
    use_lockfile = true
  }
}
