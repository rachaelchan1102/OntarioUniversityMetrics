// Status normalization logic
const ACCEPTED_VALUES = [
	'accepted', 'admitted', 'offer accepted', 'admit', 'yes', 'confirmed', 'accept', 'offered', 'admission', 'enrolled', 'offer'
];
const REJECTED_VALUES = [
	'rejected', 'denied', 'declined', 'no', 'not admitted', 'refused', 'not accepted', 'not offered'
];
const WAITLISTED_VALUES = [
	'waitlisted', 'wait list', 'wait-list', 'wait', 'pending', 'deferred', 'hold'
];

function normalizeStatus(raw: string): 'accepted' | 'rejected' | 'waitlisted' | 'unknown' {
	if (!raw) return 'unknown';
	const val = raw.trim().toLowerCase();
	if (ACCEPTED_VALUES.includes(val)) return 'accepted';
	if (REJECTED_VALUES.includes(val)) return 'rejected';
	if (WAITLISTED_VALUES.includes(val)) return 'waitlisted';
	return 'unknown';
}

export { normalizeStatus };
