package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"ancora/config"
	"ancora/orchestrator"

	"github.com/go-chi/chi/v5"
)

func setupTestServer(t *testing.T) (*chi.Mux, string) {
	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, "config.json")

	cfg := &config.Config{
		AdminCredentials: "", // Empty for bootstrap
	}
	if err := config.SaveConfig(configPath, cfg); err != nil {
		t.Fatal(err)
	}

	runner := orchestrator.NewRunner(configPath, filepath.Join(tempDir, "state.json"), tempDir, make([]byte, 32))
	server := NewServer(configPath, runner, nil, make([]byte, 32))

	r := chi.NewRouter()
	r.Post("/api/auth/bootstrap", server.HandleBootstrap)
	r.Post("/api/auth/login", server.HandleLogin)
	r.Post("/api/auth/logout", server.HandleLogout)

	r.Group(func(r chi.Router) {
		r.Use(server.JWTMiddleware)
		r.Get("/api/config", server.HandleGetConfig)
	})

	return r, configPath
}

func TestAuthFlow(t *testing.T) {
	r, configPath := setupTestServer(t)

	// 1. Try accessing protected route (should fail)
	req := httptest.NewRequest("GET", "/api/config", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusUnauthorized {
		t.Fatalf("Expected 401 Unauthorized, got %v", w.Result().StatusCode)
	}

	// 2. Bootstrap with weak password (should fail)
	weakPayload, _ := json.Marshal(AuthRequest{Password: "123"})
	req = httptest.NewRequest("POST", "/api/auth/bootstrap", bytes.NewBuffer(weakPayload))
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusBadRequest {
		t.Fatalf("Expected 400 Bad Request for weak password, got %v", w.Result().StatusCode)
	}

	// 3. Bootstrap success
	validPayload, _ := json.Marshal(AuthRequest{Password: "strong-password-123"})
	req = httptest.NewRequest("POST", "/api/auth/bootstrap", bytes.NewBuffer(validPayload))
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK for bootstrap, got %v", w.Result().StatusCode)
	}
	cookies := w.Result().Cookies()
	if len(cookies) == 0 || cookies[0].Name != "ancora_session" {
		t.Fatalf("Expected cookie ancora_session to be set")
	}

	// Verify config was updated
	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.AdminCredentials == "" {
		t.Fatalf("Expected config AdminCredentials to be updated")
	}

	// 4. Try Bootstrapping again (should fail)
	req = httptest.NewRequest("POST", "/api/auth/bootstrap", bytes.NewBuffer(validPayload))
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403 Forbidden for second bootstrap, got %v", w.Result().StatusCode)
	}

	// 5. Login Failure (wrong password)
	wrongPayload, _ := json.Marshal(AuthRequest{Password: "wrong-password"})
	req = httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(wrongPayload))
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusUnauthorized {
		t.Fatalf("Expected 401 Unauthorized for wrong login, got %v", w.Result().StatusCode)
	}

	// 6. Login Success
	req = httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(validPayload))
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK for valid login, got %v", w.Result().StatusCode)
	}

	// Get the new session cookie
	sessionCookie := w.Result().Cookies()[0]

	// 7. Access Protected Route Successfully
	req = httptest.NewRequest("GET", "/api/config", nil)
	req.AddCookie(sessionCookie)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Result().StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK for protected route, got %v", w.Result().StatusCode)
	}
}
