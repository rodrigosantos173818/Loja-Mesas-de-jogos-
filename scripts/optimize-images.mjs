import sharp from 'sharp'

const names = ['sinuca-hero', 'futmesa', 'ping-pong', 'pebolim']
for (const name of names) {
  const input = `assets/source-images/${name}.png`
  const output = `public/images/${name}.webp`
  await sharp(input).webp({ quality: 82, effort: 5 }).toFile(output)
  console.log(`${name}: WebP criado`)
}
