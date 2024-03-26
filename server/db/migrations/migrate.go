package main

import (
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	databaseHost := os.Getenv("dilutionDemoDatabaseHost")
	databaseName := os.Getenv("dilutionDemoDatabaseName")
	databaseUser := os.Getenv("dilutionDemoDatabaseUser")

	if databaseHost == "" || databaseName == "" || databaseUser == "" {
		log.Fatal("run 'export \"$(pulumi stack output --cwd --shell)\"' to set the necessary environment variables")
	}

	databasePassword, passwordSet := os.LookupEnv("dilutionDemoDatabasePassword")
	if !passwordSet {
		log.Fatal("set the dilutionDemoDatabasePassword environment variable")
	}

	migrationDirection := "up"
	if len(os.Args) > 1 {
		migrationDirection = strings.ToLower(os.Args[1])
	}
	if migrationDirection != "up" && migrationDirection != "down" {
		log.Fatal("usage: go run migrate_db.go [up|down]")
	}

	// Fetch the files in the migrations directory
	_, filename, _, _ := runtime.Caller(0)
	migrationDir := filepath.Dir(filename)
	files, err := os.ReadDir(migrationDir)

	// Only keep files that match migration direction
	migratingFiles := []fs.DirEntry{}
	for _, file := range files {
		filenameParts := strings.Split(file.Name(), ".")
		if filenameParts[len(filenameParts)-1] == "sql" && filenameParts[len(filenameParts)-2] == migrationDirection {
			migratingFiles = append(migratingFiles, file)
		}
	}

	if err != nil {
		log.Fatal(err)
	}
	
	// Confirm with user the migration that is about to run
	fmt.Printf("Targeting database: 'postgres://%s/%s'\n", databaseHost, databaseName)
	fmt.Println("This will run the following migrations:")
	for _, file := range migratingFiles {
		fmt.Printf(" - %s\n", file.Name())
	}
	fmt.Printf("\nContinue? (y/n): ")

	var confirm string
	fmt.Scanln(&confirm)
	if confirm != "y" {
		log.Fatal("exiting")
	}

	url := fmt.Sprintf("postgres://%s:%s@%s:5432/%s?sslmode=disable", databaseUser, databasePassword, databaseHost, databaseName)

	if err != nil {
		log.Fatal(err)
	}
	m, err := migrate.New(
		fmt.Sprintf("file://%s",migrationDir),
		url)
		
		if err != nil {
			log.Fatal(err)
		}
		
		if migrationDirection == "up" {
			err = m.Up()
		} else {
			err = m.Down()
		}

		if err != nil {
			log.Fatal(err)
		}

		fmt.Println("Migration successful")
	}