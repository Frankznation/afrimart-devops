// Run this in Jenkins Script Console (Manage Jenkins > Script Console)
// Replace YOUR_WEBHOOK_URL with your Slack webhook, then paste and Run

import jenkins.model.Jenkins
import com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl
import org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl
import com.cloudbees.plugins.credentials.domains.Domain
import com.cloudbees.plugins.credentials.CredentialsProvider

def webhookUrl = 'YOUR_WEBHOOK_URL'  // Get from Slack App: Incoming Webhooks
if (webhookUrl == 'YOUR_WEBHOOK_URL') {
  println 'ERROR: Replace YOUR_WEBHOOK_URL with your Slack webhook before running'
  return
}

def domain = Domain.global()
def store = Jenkins.instance.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

def credential = new StringCredentialsImpl(
  com.cloudbees.plugins.credentials.CredentialsScope.GLOBAL,
  'slack-webhook',
  'Slack Incoming Webhook',
  new hudson.util.Secret(webhookUrl)
)

store.addCredentials(domain, credential)
println 'Added slack-webhook credential successfully'
