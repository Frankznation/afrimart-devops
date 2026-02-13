{{/*
Expand the name of the chart.
*/}}
{{- define "afrimart.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "afrimart.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "afrimart.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | quote }}
{{- end }}
