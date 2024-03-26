package db

import (
	"fmt"
	"io/fs"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	databaseHost := os.Getenv("dilutionDemoDatabaseHost")
	databaseName := os.Getenv("dilutionDemoDatabaseName")
	databaseUser := os.Getenv("dilutionDemoDatabaseUser")

	if databaseHost == "" || databaseName == "" || databaseUser == "" {
		log.Fatal("run 'export \"$(pulumi stack output --cwd ../infra --shell)\"' to set the necessary environment variables")
	}

	databasePassword, passwordSet := os.LookupEnv("dilutionDemoDatabasePassword")
	if !passwordSet {
		log.Fatal("set the dilutionDemoDatabasePassword environment variable")
	}

	// Fetch the files in the migrations directory
	files, err := os.ReadDir("migrations")
	// Only keep "up" files
	upFiles := []fs.DirEntry{}
	for i, file := range files {
		if file.IsDir() || file.Name()[:2] != "up" {
			upFiles = append(upFiles, files[i+1:]...)
		}
	}

	if err != nil {
		log.Fatal(err)
	}

	// Confirm with user the migration that is about to run
	fmt.Printf("Targeting database: 'postgres://%s/%s'\n", databaseHost, databaseName)
	fmt.Println("This will run the following migrations:")
	for _, file := range upFiles {
		fmt.Printf(" - %s\n", file.Name())
	}
	fmt.Printf("\nContinue? (y/n): ")

	var confirm string
	fmt.Scanln(&confirm)
	if confirm != "y" {
		log.Fatal("exiting")
	}

	url := fmt.Sprintf("postgres://%s:%s@%s:5432/%s?sslmode=disable", databaseUser, databasePassword, databaseHost, databaseName)

	m, err := migrate.New(
		"file:///Users/ryankilroy/Workspace/dilution-demo/server/db/migrations/",
		url)
		
		if err != nil {
			log.Fatal(err)
		}
		if err := m.Up(); err != nil {
			log.Fatal(err)
		}
	}