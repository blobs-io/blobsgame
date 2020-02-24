package web

import (
	"fmt"
	"github.com/blobs-io/blobsgame/http/web/routes"
	"github.com/gorilla/mux"
	"net/http"
	"strconv"
)

var Router *mux.Router

const (
	HomeRoute = "/"
	LoginRoute = "/login"
	RegisterRoute = "/register"
	AppRoute = "/app"
	GameRoute = "/game"
)

func Init(port int) {
	RouteCache = make(map[string][]byte)
	Router = mux.NewRouter()

	// Main routes
	Router.HandleFunc(HomeRoute, HandleStatic(HomeRoute)).Methods("GET")
	Router.HandleFunc(LoginRoute, HandleStatic(LoginRoute)).Methods("GET")
	Router.HandleFunc(LoginRoute, routes.Login).Methods("POST")
	Router.HandleFunc(RegisterRoute, HandleStatic(RegisterRoute)).Methods("GET")
	Router.HandleFunc(RegisterRoute, routes.Register).Methods("POST")
	Router.HandleFunc(AppRoute, HandleStatic(AppRoute)).Methods("GET")
	Router.HandleFunc(GameRoute, HandleStatic(GameRoute)).Methods("GET")
	// Assets
	Router.PathPrefix("/").Handler(http.FileServer(http.Dir("./public")))

	fmt.Printf("Webserver running on port %d\n", port)
	err := http.ListenAndServe(":" + strconv.Itoa(port), Router)
	if err != nil {
		panic(err)
	}
}