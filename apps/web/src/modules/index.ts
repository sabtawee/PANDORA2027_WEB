import "server-only";

// Registers every module's event handlers. Imported once from core/auth
// (where events are first emitted). Order matters for "user.registered":
// referral must be recorded before Discord linking can qualify it.
import "./preregister/handlers";
import "./referral/handlers";
import "./discord/handlers";
import "./tracking/handlers";
