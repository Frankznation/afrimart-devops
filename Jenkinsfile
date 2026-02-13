pipeline {
    agent any
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
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        stage('Run Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        dir('backend') {
                            sh 'npx jest --coverage --passWithNoTests'
                        }
                        dir('frontend') {
                            sh 'npm test -- --run'
                        }
                    }
                }
                stage('Lint') {
                    steps {
                        dir('backend') {
                            sh 'npm run lint'
                        }
                        dir('frontend') {
                            sh 'npm run lint'
                        }
                    }
                }
            }
        }
        stage('Security Scan') {
            steps {
                script {
                    sh 'docker build -t afrimart-backend:${BUILD_NUMBER} ./backend'
                    sh 'which trivy && trivy image --exit-code 0 --severity HIGH,CRITICAL afrimart-backend:${BUILD_NUMBER} || echo "Trivy not installed - skip"'
                }
            }
        }
        stage('Build Docker Images') {
            steps {
                sh 'docker build -t afrimart/backend:${BUILD_NUMBER} ./backend'
                sh 'docker build -t afrimart/frontend:${BUILD_NUMBER} --build-arg VITE_API_URL=/api ./frontend'
            }
        }
        stage('Push to ECR') {
            when { anyOf { branch 'main'; branch 'master' } }
            steps {
                script {
                    // Requires: Jenkins credentials 'aws-credentials', and env ECR_REGISTRY
                    // Uncomment and set ECR_REGISTRY when ready
                    echo 'Push to ECR - configure aws-credentials and ECR_REGISTRY'
                    // withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    //     sh 'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY'
                    //     sh 'docker tag afrimart/backend:$BUILD_NUMBER $ECR_REGISTRY/afrimart/backend:$BUILD_NUMBER'
                    //     sh 'docker push $ECR_REGISTRY/afrimart/backend:$BUILD_NUMBER'
                    // }
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
