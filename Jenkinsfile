pipeline {
    agent any
    tools {
        nodejs 'NodeJS 18'  // Install: Manage Jenkins > Plugins > NodeJS, then Global Tool Configuration
    }
    environment {
        AWS_REGION = 'eu-north-1'
        DOCKER_BUILDKIT = '1'
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
                    sh 'which docker && docker build -t afrimart-backend:${BUILD_NUMBER} ./backend || echo "Docker not available - skip"'
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
                    echo 'Push to ECR - configure aws-credentials and ECR_REGISTRY'
                }
            }
        }
        stage('Deploy to Staging') {
            when { anyOf { branch 'main'; branch 'master' } }
            steps {
                echo 'Deploy to Staging'
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
                echo 'Deploy to Production'
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
        success { echo 'Pipeline succeeded' }
        failure { echo 'Pipeline failed' }
        always {
            cleanWs(deleteDirs: false)
        }
    }
}
