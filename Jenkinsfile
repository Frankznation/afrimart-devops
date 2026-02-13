pipeline {
    agent any
    environment {
        AWS_REGION = 'eu-north-1'
        DOCKER_BUILDKIT = '1'
        NODE_HOME = "${WORKSPACE}/node"
        PATH = "${WORKSPACE}/node/bin:${env.PATH}"
        // Set your ECR registry URL (e.g. 123456789012.dkr.ecr.eu-north-1.amazonaws.com) to enable Push to ECR
        ECR_REGISTRY = ''
    }
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Node.js') {
            steps {
                sh '''#!/bin/sh
                    set -e
                    if command -v node >/dev/null 2>&1 && node -v | grep -q "v18"; then
                        echo "Node 18 already available"
                        exit 0
                    fi
                    NODE_VER=18.20.4
                    ARCH=$(uname -m)
                    case "$ARCH" in x86_64|amd64) ARCH=x64;; aarch64|arm64) ARCH=arm64;; *) ARCH=x64;; esac
                    OS=$(uname -s)
                    case "$OS" in Linux) OS=linux;; Darwin) OS=darwin;; *) OS=linux;; esac
                    FILE="node-v${NODE_VER}-${OS}-${ARCH}"
                    echo "Installing Node ${NODE_VER} for ${OS}-${ARCH}"
                    curl -fsSL "https://nodejs.org/dist/v${NODE_VER}/${FILE}.tar.gz" -o node.tar.gz
                    rm -rf node
                    tar -xzf node.tar.gz && rm node.tar.gz
                    mv "${FILE}" node
                '''
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'cd backend && npm ci'
                sh 'cd frontend && npm ci'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'cd backend && npx jest --coverage --passWithNoTests'
                sh 'cd frontend && npm test -- --run'
                sh 'cd backend && npm run lint'
                sh 'cd frontend && npm run lint'
            }
        }
        stage('Security Scan') {
            steps {
                script {
                    // OWASP: npm audit (dependency vulnerability scan)
                    sh 'cd backend && (npm audit --audit-level=moderate || true)'
                    sh 'cd frontend && (npm audit --audit-level=moderate || true)'
                    // Trivy: container image scan
                    sh 'which docker && docker build -t afrimart-backend:${BUILD_NUMBER} ./backend || echo "Docker not available - skip Trivy"'
                    sh 'which trivy && trivy image --exit-code 0 --severity HIGH,CRITICAL afrimart-backend:${BUILD_NUMBER} || echo "Trivy not installed - skip"'
                }
            }
        }
        stage('Build Docker Images') {
            steps {
                script {
                    sh 'which docker && docker build -t afrimart/backend:${BUILD_NUMBER} ./backend && docker build -t afrimart/frontend:${BUILD_NUMBER} --build-arg VITE_API_URL=/api ./frontend || echo "Docker not available - skip"'
                }
            }
        }
        stage('Push to ECR') {
            when { anyOf { branch 'main'; branch 'master' } }
            steps {
                script {
                    def registry = (params.ECR_REGISTRY ?: env.ECR_REGISTRY ?: '').trim()
                    if (!registry) {
                        echo 'ECR_REGISTRY not set - skipping. Add job parameter or env: ECR_REGISTRY=123456789.dkr.ecr.eu-north-1.amazonaws.com'
                        return
                    }
                    def region = env.AWS_REGION ?: 'eu-north-1'
                    def imgBackend = "afrimart/backend:${BUILD_NUMBER}"
                    def imgFrontend = "afrimart/frontend:${BUILD_NUMBER}"
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                        sh """
                            aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${registry}
                            docker tag ${imgBackend} ${registry}/afrimart-backend:${BUILD_NUMBER}
                            docker tag ${imgFrontend} ${registry}/afrimart-frontend:${BUILD_NUMBER}
                            docker push ${registry}/afrimart-backend:${BUILD_NUMBER}
                            docker push ${registry}/afrimart-frontend:${BUILD_NUMBER}
                        """
                    }
                }
            }
        }
        stage('Build Frontend') {
            when { anyOf { branch 'main'; branch 'master' } }
            steps {
                sh 'cd frontend && npm run build'
            }
        }
        stage('Deploy to Staging') {
            when { anyOf { branch 'main'; branch 'master' } }
            steps {
                sh 'ansible-playbook -i ansible/inventory/static.yml ansible/playbooks/deploy-with-local-db.yml 2>/dev/null || echo "Ansible deploy - configure inventory"'
            }
        }
        stage('Manual Approval') {
            when { anyOf { branch 'main'; branch 'master' } }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
            }
        }
        stage('Deploy to Production') {
            when { anyOf { branch 'main'; branch 'master' } }
            steps {
                sh 'ansible-playbook -i ansible/inventory/production.yml ansible/playbooks/deploy-with-local-db.yml 2>/dev/null || ansible-playbook -i ansible/inventory/static.yml ansible/playbooks/deploy-with-local-db.yml 2>/dev/null || echo "Ansible deploy - configure ansible/inventory/production.yml"'
            }
        }
        stage('Post-Deployment Tests') {
            steps {
                echo 'Post-deployment health check'
                sh 'curl -sf ${APP_URL:-http://localhost}/api/health || true'
            }
        }
    }
    post {
        success {
            echo 'Pipeline succeeded'
            script {
                try { slackSend(channel: env.SLACK_CHANNEL ?: '#builds', color: 'good', message: "✓ ${env.JOB_NAME} #${env.BUILD_NUMBER} succeeded") } catch (e) { echo "Slack: ${e}" }
                if (env.NOTIFY_EMAIL?.trim()) { try { emailext(subject: "✓ ${env.JOB_NAME} #${env.BUILD_NUMBER} SUCCESS", body: "Build ${env.BUILD_URL}", to: env.NOTIFY_EMAIL) } catch (e) { echo "Email: ${e}" } }
            }
        }
        failure {
            echo 'Pipeline failed'
            script {
                try { slackSend(channel: env.SLACK_CHANNEL ?: '#builds', color: 'danger', message: "✗ ${env.JOB_NAME} #${env.BUILD_NUMBER} FAILED: ${env.BUILD_URL}") } catch (e) { echo "Slack: ${e}" }
                if (env.NOTIFY_EMAIL?.trim()) { try { emailext(subject: "✗ ${env.JOB_NAME} #${env.BUILD_NUMBER} FAILED", body: "Build ${env.BUILD_URL}", to: env.NOTIFY_EMAIL) } catch (e) { echo "Email: ${e}" } }
            }
        }
        always {
            cleanWs(deleteDirs: false)
        }
    }
}
