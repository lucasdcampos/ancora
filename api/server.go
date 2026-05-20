package api

import (
	"log"
	"net/http"

	"ancora/orchestrator"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	ConfigPath    string
	Runner        *orchestrator.Runner
	JWTSecret     []byte
	UIFS          http.FileSystem
	EncryptionKey []byte
}

func NewServer(configPath string, runner *orchestrator.Runner, uiFS http.FileSystem, encKey []byte) *Server {
	return &Server{
		ConfigPath:    configPath,
		Runner:        runner,
		JWTSecret:     []byte("super-secret-key-replace-in-production"),
		UIFS:          uiFS,
		EncryptionKey: encKey,
	}
}

func (s *Server) Start(port string) {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Route("/api", func(r chi.Router) {
		r.Post("/auth/bootstrap", s.HandleBootstrap)
		r.Post("/auth/login", s.HandleLogin)
		r.Post("/auth/logout", s.HandleLogout)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(s.JWTMiddleware)

			r.Get("/config", s.HandleGetConfig)
			r.Put("/config", s.HandlePutConfig)

			r.Post("/projects/{name}/restart", s.HandleRestartProject)
			r.Post("/projects/{name}/stop", s.HandleStopProject)

			r.Get("/metrics", s.HandleGetMetrics)
		})
	})

	if s.UIFS != nil {
		fsHandler := http.FileServer(s.UIFS)
		r.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fsHandler.ServeHTTP(w, r)
		}))
	}

	log.Printf("Starting API server on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("API server failed: %v", err)
	}
}
