#!/bin/bash
# AfriMart Security Scan - Trivy, tfsec, npm audit, OWASP Dependency Check
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

REPORT_DIR="${REPORT_DIR:-$PROJECT_ROOT/security-reports}"
mkdir -p "$REPORT_DIR"
echo "Reports will be saved to: $REPORT_DIR"
echo ""

# 1. Trivy - container image scan
echo "=== 1. Trivy (Container Image Scan) ==="
if command -v trivy &>/dev/null && command -v docker &>/dev/null; then
  for img in backend frontend; do
    if docker build -t "afrimart-$img:scan" "./$img" 2>/dev/null; then
      trivy image --format table --output "$REPORT_DIR/trivy-$img.txt" "afrimart-$img:scan" 2>/dev/null || trivy image "afrimart-$img:scan" 2>/dev/null || true
      echo "  Trivy $img: report in $REPORT_DIR/trivy-$img.txt"
    fi
  done
else
  echo "  Skip: trivy or docker not found"
fi
echo ""

# 2. tfsec - Terraform security scan
echo "=== 2. tfsec (Infrastructure Scan) ==="
if command -v tfsec &>/dev/null; then
  tfsec terraform/ --out "$REPORT_DIR/tfsec.txt" --format default 2>/dev/null || tfsec terraform/ 2>/dev/null || true
  echo "  tfsec: report in $REPORT_DIR/tfsec.txt"
else
  echo "  Skip: tfsec not found (install: brew install tfsec)"
fi
echo ""

# 3. npm audit - dependency vulnerabilities
echo "=== 3. npm audit (Dependency Scan) ==="
for dir in backend frontend; do
  if [ -f "$dir/package.json" ]; then
    (cd "$dir" && npm audit --audit-level=moderate 2>/dev/null || true) | tee "$REPORT_DIR/npm-audit-$dir.txt" || true
    echo "  npm audit $dir: report in $REPORT_DIR/npm-audit-$dir.txt"
  fi
done
echo ""

# 4. OWASP Dependency Check (optional)
echo "=== 4. OWASP Dependency Check ==="
if command -v dependency-check &>/dev/null; then
  for dir in backend frontend; do
    if [ -f "$dir/package.json" ]; then
      dependency-check --project "$dir" --scan "$dir" --out "$REPORT_DIR/owasp-$dir" --format HTML 2>/dev/null || true
      echo "  OWASP $dir: report in $REPORT_DIR/owasp-$dir/"
    fi
  done
else
  echo "  Skip: dependency-check not found (install: https://owasp.org/www-project-dependency-check/)"
fi
echo ""

echo "=== Security scan complete ==="
echo "Reports: $REPORT_DIR"
