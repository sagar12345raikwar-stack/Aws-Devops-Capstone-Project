resource "aws_kms_key" "eks" {
  description             = "EKS secrets encryption key"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}


resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-eks"
  role_arn = aws_iam_role.eks_cluster_role.arn

  version = "1.33"

  vpc_config {
    subnet_ids = module.vpc.private_subnets

    endpoint_private_access = true
    endpoint_public_access  = false
  }
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }

    resources = ["secrets"]
  }


  # aws cloudwatch service
  enabled_cluster_log_types = [
    "api",
    "audit",

    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Terraform   = "true"
  }
}
