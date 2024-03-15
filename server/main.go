package main

import (
	"fmt"
	"net/http"
)

func handlerFoo(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello from the Go backend!")
}

func main() {
	http.HandleFunc("/foo", handlerFoo)
	fmt.Println("Server listening on port 8080")
	http.ListenAndServe(":8080", nil)
}
