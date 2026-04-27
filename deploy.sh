#!/bin/bash

# TRD Store Deployment & Monitoring Script
# Usage: ./deploy.sh [start|stop|restart|logs|status|update|backup]

set -e

PROJECT_DIR="/var/www/trd-store"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"
LOG_DIR="/var/log/trd-store"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Start services
start_services() {
    print_status "Starting TRD Store services..."
    
    print_status "Starting PostgreSQL..."
    systemctl start postgresql
    
    print_status "Starting Redis..."
    systemctl start redis-server
    
    print_status "Starting backend..."
    systemctl start trd-store-backend.service
    
    print_status "Starting frontend..."
    systemctl start trd-store-frontend.service
    
    print_status "Reloading Nginx..."
    systemctl reload nginx
    
    print_status "All services started successfully!"
}

# Stop services
stop_services() {
    print_status "Stopping TRD Store services..."
    
    print_status "Stopping frontend..."
    systemctl stop trd-store-frontend.service || true
    
    print_status "Stopping backend..."
    systemctl stop trd-store-backend.service || true
    
    print_status "Stopping Redis..."
    systemctl stop redis-server || true
    
    print_status "Stopping PostgreSQL..."
    systemctl stop postgresql || true
    
    print_status "All services stopped!"
}

# Restart services
restart_services() {
    print_status "Restarting TRD Store services..."
    stop_services
    sleep 2
    start_services
}

# View logs
view_logs() {
    case "${1:-backend}" in
        backend)
            print_status "Backend logs (last 50 lines):"
            journalctl -u trd-store-backend.service -n 50
            ;;
        frontend)
            print_status "Frontend logs (last 50 lines):"
            journalctl -u trd-store-frontend.service -n 50
            ;;
        nginx)
            print_status "Nginx error logs (last 50 lines):"
            tail -n 50 /var/log/nginx/error.log
            ;;
        all)
            print_status "All service logs (last 20 lines each):"
            echo "=== Backend ==="
            journalctl -u trd-store-backend.service -n 20
            echo -e "\n=== Frontend ==="
            journalctl -u trd-store-frontend.service -n 20
            echo -e "\n=== Nginx ==="
            tail -n 20 /var/log/nginx/error.log
            ;;
        *)
            print_error "Unknown log type: $1"
            echo "Usage: ./deploy.sh logs [backend|frontend|nginx|all]"
            ;;
    esac
}

# Service status
service_status() {
    print_status "TRD Store Services Status:"
    echo ""
    echo "Backend:"
    systemctl status trd-store-backend.service || print_warning "Backend not running"
    echo ""
    echo "Frontend:"
    systemctl status trd-store-frontend.service || print_warning "Frontend not running"
    echo ""
    echo "PostgreSQL:"
    systemctl is-active postgresql && echo "✓ Running" || print_warning "PostgreSQL not running"
    echo ""
    echo "Redis:"
    systemctl is-active redis-server && echo "✓ Running" || print_warning "Redis not running"
    echo ""
    echo "Nginx:"
    systemctl is-active nginx && echo "✓ Running" || print_warning "Nginx not running"
}

# Update application
update_application() {
    print_status "Updating TRD Store..."
    
    cd "$PROJECT_DIR"
    print_status "Pulling latest changes from git..."
    git pull origin main
    
    print_status "Updating backend dependencies..."
    cd "$BACKEND_DIR"
    source "$VENV_DIR/bin/activate"
    pip install -r requirements.txt
    
    print_status "Running database migrations..."
    python manage.py migrate
    
    print_status "Collecting static files..."
    python manage.py collectstatic --noinput
    
    print_status "Updating frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    
    print_status "Building frontend..."
    npm run build
    
    print_status "Restarting services..."
    restart_services
    
    print_status "Update completed successfully!"
}

# Backup database
backup_database() {
    print_status "Creating database backup..."
    BACKUP_DIR="/var/backups/trd-store"
    mkdir -p "$BACKUP_DIR"
    
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/trd_store_$DATE.sql.gz"
    
    sudo -u postgres pg_dump trd_store | gzip > "$BACKUP_FILE"
    
    print_status "Backup created: $BACKUP_FILE"
    
    # Keep only last 30 days
    print_status "Cleaning old backups..."
    find "$BACKUP_DIR" -name "trd_store_*.sql.gz" -mtime +30 -delete
    
    print_status "Backup completed!"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check backend
    print_status "Checking backend health..."
    if curl -s http://127.0.0.1:8000/api/v1/categories/ > /dev/null; then
        print_status "✓ Backend API responding"
    else
        print_error "✗ Backend API not responding"
    fi
    
    # Check frontend
    print_status "Checking frontend health..."
    if curl -s http://127.0.0.1:3000/ > /dev/null; then
        print_status "✓ Frontend responding"
    else
        print_error "✗ Frontend not responding"
    fi
    
    # Check database
    print_status "Checking database..."
    if pg_isready -h localhost -U trd_store > /dev/null; then
        print_status "✓ Database connection OK"
    else
        print_error "✗ Database connection failed"
    fi
    
    # Check Redis
    print_status "Checking Redis..."
    if redis-cli ping > /dev/null; then
        print_status "✓ Redis connection OK"
    else
        print_error "✗ Redis connection failed"
    fi
}

# Display usage
show_usage() {
    echo "TRD Store Deployment Script"
    echo "Usage: $0 {start|stop|restart|logs|status|update|backup|health}"
    echo ""
    echo "Commands:"
    echo "  start           - Start all services"
    echo "  stop            - Stop all services"
    echo "  restart         - Restart all services"
    echo "  logs [type]     - View logs (backend, frontend, nginx, all)"
    echo "  status          - Show service status"
    echo "  update          - Pull latest changes and rebuild"
    echo "  backup          - Create database backup"
    echo "  health          - Run health checks"
    echo ""
}

# Main
main() {
    check_root
    
    case "${1:-status}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            view_logs "$2"
            ;;
        status)
            service_status
            ;;
        update)
            update_application
            ;;
        backup)
            backup_database
            ;;
        health)
            health_check
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
