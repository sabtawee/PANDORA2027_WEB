import "server-only";

// Registers every module's event handlers. Import once from core/auth
// (the place events are first emitted). Add new modules here.
import "./preregister/handlers";
