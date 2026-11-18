import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveGalleryImageAltText,
  resolveGalleryPhotoNoteText,
} from '../../src/components/PlaceCard/common/galleryPhotoNote.js';

test('stock unsplash alt is for img only, not lightbox note', () => {
  const img = {
    id: 'u-1',
    alt_description: 'A large body of water surrounded by trees',
    description: 'A large body of water surrounded by trees',
    user: { name: 'Jane' },
  };
  assert.match(resolveGalleryImageAltText(img), /large body of water/i);
  assert.equal(resolveGalleryPhotoNoteText(img), '');
});

test('pexels auto alt does not produce a photo note', () => {
  const img = {
    id: 'pexels-1',
    source: 'pexels',
    alt_description: 'Ocean waves on sand',
    user: { name: 'Alex' },
  };
  assert.equal(resolveGalleryPhotoNoteText(img), '');
  assert.match(resolveGalleryImageAltText(img), /ocean waves/i);
});

test('wikimedia and tourapi captions are shown as notes', () => {
  const wiki = {
    id: 'commons-1',
    source: 'wikimedia',
    alt_description: 'Khao Lak lighthouse on the rock',
  };
  assert.equal(resolveGalleryPhotoNoteText(wiki), 'Khao Lak lighthouse on the rock');
  const tour = {
    id: 'tourapi-detail-1',
    source: 'tourapi',
    alt_description: '경복궁 근정전',
    tourApi: { title: '경복궁 전경' },
  };
  assert.equal(resolveGalleryPhotoNoteText(tour), '경복궁 전경');
});

test('scenic SSOT uses manual alt as note', () => {
  const scenic = {
    id: 'local-scenic-official-x',
    source: 'korea-scenic-ssot',
    alt_description: '흥사',
  };
  assert.equal(resolveGalleryPhotoNoteText(scenic), '흥사');
});