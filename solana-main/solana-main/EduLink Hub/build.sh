#!/bin/bash
# Render Build Script for EduLink Hub Laravel Backend

echo "==> Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

echo "==> Caching config, routes, views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Build complete!"
