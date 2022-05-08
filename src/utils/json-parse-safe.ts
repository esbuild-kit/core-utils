export function jsonParseSafe(string: string) {
	try {
		return JSON.parse(string);
	} catch {
		return null;
	}
}
