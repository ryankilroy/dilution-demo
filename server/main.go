package main

import (
	"fmt"
	"net/http"
	"os"

	"dilution-demo/db"
	"dilution-demo/schema"

	"github.com/graphql-go/handler"
)

func main() {

	hostname := os.Getenv("dilutionDemoDatabaseHost")
	dbName := os.Getenv("dilutionDemoDatabaseName")
	user := os.Getenv("dilutionDemoDatabaseUser")
	if (hostname == "" || dbName == "" || user == "") {
		fmt.Println("Please set the environment variables from your Pulumi stack: `export $(pulumi stack output)`")
		os.Exit(1)
	}

	password := os.Getenv("dilutionDemoDatabasePassword")
	if (password == "") {
		fmt.Println("Please set the environment variable `dilutionDemoDatabasePassword`")
		os.Exit(1)
	}
	
	connectionUrl := fmt.Sprintf("postgres://%s:%s@%s:5432/%s", user, password, hostname, dbName)
	err := db.InitDB(connectionUrl)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println("Database connection established")

	h := handler.New(&handler.Config{
		Schema: &schema.Schema,
		Pretty: true,
	})

	http.Handle("/graphql", h)
	fmt.Println("Server listening on port 8080")
	http.ListenAndServe(":8080", nil)
}