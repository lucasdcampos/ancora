package security

import (
	"path/filepath"
	"testing"
)

func TestCrypto(t *testing.T) {
	tempDir := t.TempDir()
	keyPath := filepath.Join(tempDir, "test.key")

	// Test key generation
	key, err := GetOrGenerateKey(keyPath)
	if err != nil {
		t.Fatalf("Failed to generate key: %v", err)
	}
	if len(key) != 32 {
		t.Fatalf("Expected 32-byte key, got %d", len(key))
	}

	// Test key persistence
	key2, err := GetOrGenerateKey(keyPath)
	if err != nil {
		t.Fatalf("Failed to load existing key: %v", err)
	}
	if string(key) != string(key2) {
		t.Fatal("Loaded key does not match generated key")
	}

	// Test encryption/decryption
	original := "secret message"
	encrypted, err := Encrypt(original, key)
	if err != nil {
		t.Fatalf("Encryption failed: %v", err)
	}
	if encrypted == original {
		t.Fatal("Encrypted text should not match original")
	}

	decrypted, err := Decrypt(encrypted, key)
	if err != nil {
		t.Fatalf("Decryption failed: %v", err)
	}
	if decrypted != original {
		t.Fatalf("Decrypted text %q does not match original %q", decrypted, original)
	}

	// Test with empty string
	encEmpty, err := Encrypt("", key)
	if err != nil || encEmpty != "" {
		t.Fatal("Expected empty string encryption to be identity")
	}
}
