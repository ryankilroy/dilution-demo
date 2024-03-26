package main

import (
	"fmt"
	"net/http"

	"dilution-demo/db"
	"dilution-demo/schema"

	"github.com/graphql-go/handler"
)

func main() {
	db.InitDB("postgres://dilutionDemoDatabaseUser:dilutionDemoDatabasePassword@dilutionDemoDatabaseHost:5432/dilutionDemoDatabaseName?sslmode=disable")

	h := handler.New(&handler.Config{
		Schema: &schema.Schema,
		Pretty: true,
	})

	http.Handle("/graphql", h)
	fmt.Println("Server listening on port 8080")
	http.ListenAndServe(":8080", nil)
}