import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Registrasi Acara | Hexpharm Jaya',description:'Registrasi acara Hexpharm Jaya'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
