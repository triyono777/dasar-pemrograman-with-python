import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialProgressState } from '../data/badgesAndPeers';
import {
  buildProfileShareText,
  buildProfileShareUrl,
  buildSharedProfilePayload,
  decodeSharedProfilePayload,
  encodeSharedProfilePayload,
  validateProfileInput,
} from './profileShare';

test('validateProfileInput enforces required profile fields and email format', () => {
  const valid = {
    name: 'Triyono Pratama',
    nim: '24060120140099',
    kelas: 'IF-1B',
    prodi: 'Teknik Informatika',
    institusi: 'Universitas Nusantara',
    semester: 'Semester 2',
    email: 'triyono@kampus.ac.id',
    bio: 'Belajar Python dan struktur data.',
    avatarId: 'student' as const,
  };
  assert.equal(validateProfileInput(valid), null);

  assert.notEqual(validateProfileInput({ ...valid, name: 'A' }), null);
  assert.notEqual(validateProfileInput({ ...valid, nim: '12' }), null);
  assert.notEqual(validateProfileInput({ ...valid, prodi: '' }), null);
  assert.notEqual(validateProfileInput({ ...valid, email: 'bukan-email' }), null);
  assert.equal(validateProfileInput({ ...valid, email: '' }), null);
});

test('encodeSharedProfilePayload and decodeSharedProfilePayload preserve Indonesian text and stats', () => {
  const state = createInitialProgressState();
  state.profile.name = 'Siti Rahma Putri';
  state.profile.prodi = 'Sistem Informasi';
  state.profile.bio = 'Target nilai A untuk Dasar Pemrograman Python!';

  const payload = buildSharedProfilePayload(state, 3);
  const token = encodeSharedProfilePayload(payload);
  const decoded = decodeSharedProfilePayload(token);

  assert.ok(decoded);
  assert.equal(decoded.name, 'Siti Rahma Putri');
  assert.equal(decoded.prodi, 'Sistem Informasi');
  assert.equal(decoded.rank, 3);
  assert.equal(decoded.xp, state.profile.xp);
  assert.equal(decoded.completedModules, 1);
  assert.equal(decoded.totalStars, 3);
  assert.equal(decodeSharedProfilePayload('invalid%%%token'), null);
});

test('buildProfileShareUrl and buildProfileShareText produce clean shareable output', () => {
  const state = createInitialProgressState();
  const payload = buildSharedProfilePayload(state, 2);
  const shareUrl = buildProfileShareUrl('https://pydasar.vercel.app/', payload);

  assert.ok(shareUrl.startsWith('https://pydasar.vercel.app/?profil='));
  const parsedUrl = new URL(shareUrl);
  const decoded = decodeSharedProfilePayload(parsedUrl.searchParams.get('profil') ?? '');
  assert.equal(decoded?.nim, state.profile.nim);

  const summary = buildProfileShareText(payload, 10, shareUrl);
  assert.ok(summary.includes(state.profile.name));
  assert.ok(summary.includes(state.profile.prodi));
  assert.ok(summary.includes('Peringkat #2/10'));
  assert.ok(summary.includes(shareUrl));
});
