# Script to setup MySQL database for Learning API
# This script creates the database and runs migrations

Write-Host "🚀 Setting up MySQL Database for Learning API" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if we can connect to MySQL
Write-Host "\n📋 Checking MySQL connection..." -ForegroundColor Yellow

# Try different MySQL connection methods
$mysqlPaths = @(
    "mysql",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe"
)

$mysqlCmd = $null
foreach ($path in $mysqlPaths) {
    try {
        if (Test-Path $path -ErrorAction SilentlyContinue) {
            $mysqlCmd = $path
            Write-Host "✅ Found MySQL at: $path" -ForegroundColor Green
            break
        }
    } catch {
        continue
    }
}

if (-not $mysqlCmd) {
    Write-Host "❌ MySQL not found. Please install MySQL or XAMPP first." -ForegroundColor Red
    Write-Host "\n📥 Installation options:" -ForegroundColor Yellow
    Write-Host "1. XAMPP: https://www.apachefriends.org/download.html" -ForegroundColor White
    Write-Host "2. MySQL Server: https://dev.mysql.com/downloads/mysql/" -ForegroundColor White
    Write-Host "3. MySQL Workbench: https://dev.mysql.com/downloads/workbench/" -ForegroundColor White
    exit 1
}

# Get MySQL root password
$rootPassword = Read-Host "Enter MySQL root password (press Enter if no password)"

# Create connection string
if ($rootPassword) {
    $connectionArgs = @("-u", "root", "-p$rootPassword")
} else {
    $connectionArgs = @("-u", "root")
}

Write-Host "\n🔧 Creating database and user..." -ForegroundColor Yellow

try {
    # Execute the SQL script to create database
    & $mysqlCmd @connectionArgs -e "CREATE DATABASE IF NOT EXISTS learning_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database 'learning_db' created successfully!" -ForegroundColor Green
    } else {
        throw "Failed to create database"
    }
    
    # Test connection to the new database
    & $mysqlCmd @connectionArgs -e "USE learning_db; SELECT 'Connection successful!' as status;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connection to learning_db successful!" -ForegroundColor Green
    } else {
        throw "Failed to connect to learning_db"
    }
    
} catch {
    Write-Host "❌ Failed to setup database: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "\n🔧 Please try:" -ForegroundColor Yellow
    Write-Host "1. Make sure MySQL server is running" -ForegroundColor White
    Write-Host "2. Check your root password" -ForegroundColor White
    Write-Host "3. Run MySQL Workbench or phpMyAdmin to create database manually" -ForegroundColor White
    exit 1
}

# Update .env file with correct connection string
Write-Host "\n📝 Updating .env file..." -ForegroundColor Yellow

if ($rootPassword) {
    $newConnectionString = "mysql://root:$rootPassword@localhost:3306/learning_db"
} else {
    $newConnectionString = "mysql://root:@localhost:3306/learning_db"
}

# Update .env file
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace 'DATABASE_URL=".*"', "DATABASE_URL=`"$newConnectionString`""
Set-Content ".env" $envContent

Write-Host "✅ .env file updated with MySQL connection string" -ForegroundColor Green

# Generate Prisma client
Write-Host "\n🔄 Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Push schema to database (create tables)
Write-Host "\n📊 Creating database tables..." -ForegroundColor Yellow
try {
    npx prisma db push
    Write-Host "✅ Database tables created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create tables: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "\n🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if MySQL server is running" -ForegroundColor White
    Write-Host "2. Verify database 'learning_db' exists" -ForegroundColor White
    Write-Host "3. Check connection string in .env file" -ForegroundColor White
    exit 1
}

# Seed database with sample data
Write-Host "\n🌱 Seeding database with sample data..." -ForegroundColor Yellow
try {
    npx prisma db seed
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to seed database: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "\n⚠️  Tables created but seeding failed. You can try seeding later with:" -ForegroundColor Yellow
    Write-Host "npx prisma db seed" -ForegroundColor White
}

# Final verification
Write-Host "\n🔍 Verifying setup..." -ForegroundColor Yellow
try {
    & $mysqlCmd @connectionArgs -e "USE learning_db; SHOW TABLES;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "\n✅ MySQL Database Setup Complete!" -ForegroundColor Green
        Write-Host "\n📊 Database Information:" -ForegroundColor Cyan
        Write-Host "- Database: learning_db" -ForegroundColor White
        Write-Host "- Connection: $newConnectionString" -ForegroundColor White
        Write-Host "- Tables: Created via Prisma schema" -ForegroundColor White
        Write-Host "- Sample Data: Seeded (15 skills, 6 students, 4 teams, etc.)" -ForegroundColor White
        
        Write-Host "\n🚀 Next Steps:" -ForegroundColor Green
        Write-Host "1. Start the API server: npm run dev" -ForegroundColor White
        Write-Host "2. Test API: http://localhost:3002/api/learn/skills" -ForegroundColor White
        Write-Host "3. View Swagger docs: http://localhost:3002/api-docs" -ForegroundColor White
        Write-Host "4. Generate JWT token: node test-token.js" -ForegroundColor White
        
    } else {
        throw "Failed to verify database setup"
    }
    
} catch {
    Write-Host "❌ Setup verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "\n📚 For more help, see MYSQL_SETUP.md or MIGRATE_TO_MYSQL.md" -ForegroundColor Cyan