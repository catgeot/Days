# Wedge metric (r8 → r9 → r10)

## Original (r8 and earlier)

- **Band**: viewport x 72–100%, y 26–56%.
- **Pixel test**: `mean(R,G,B) < 25` → counts as “dark”.
- **Fail**: `darkFraction >= 0.35`.

## r9 change

- **Pixel test**: `R < 18 && G < 18 && B < 18` (near-black **void** / missing framebuffer).
- **Why**: After the home-fly fix, Tokyo-centered frames often show **dark Pacific ocean** in the wedge band. Ocean pixels have low mean brightness but are not black voids, so `mean < 25` produced false FAILs while the real WebKit wedge is **flat RGB ≈ 0**.

## r10

- Capture scripts report **both** `voidFraction` (RGB<18) and `legacyDarkFraction` (mean<25).
- **Gate** for merge QA: `wedgeSuspectVoid` (void fraction ≥ 0.35), not reverted to mean-only.
