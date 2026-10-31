import sharp from 'sharp';
export async function validateImage(bytes:Buffer,kind:'banner'|'logo'){
 if(bytes.length>(kind==='banner'?8:2)*1024*1024)throw new Error('Ukuran gambar melebihi batas.');
 const image=sharp(bytes,{limitInputPixels:20000000}),meta=await image.metadata();
 if(!['png','jpeg','webp'].includes(meta.format||'')||!meta.width||!meta.height)throw new Error('Gunakan gambar PNG, JPG, atau WebP yang valid.');
 await sharp(bytes,{limitInputPixels:20000000}).stats();return {width:meta.width,height:meta.height,format:meta.format};
}
