package web

import (
	"github.com/gorilla/mux"
	"net/http"
	"strconv"
)

var Router *mux.Router

func Init(port int) {
	Router = mux.NewRouter()

	err := http.ListenAndServe(":" + strconv.Itoa(port), Router)
	if err != nil {
		panic(err)
	}
}