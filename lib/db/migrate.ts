// DB migration logic
import { ensureSchema } from './schema';

export function migrate() {
	ensureSchema();
	// Add future migrations here
}
