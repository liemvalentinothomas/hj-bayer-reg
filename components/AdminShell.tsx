import Brand from './Brand';
import {logout} from '@/app/login/actions';
export default function AdminShell({children}:{children:React.ReactNode}){return <><Brand/><div className="admin-layout"><aside aria-label="Navigasi admin"><p className="eyebrow">RUANG KERJA</p><a href="/admin">Daftar acara</a><a href="/admin/organizations">Data organisasi</a><a href="/admin/settings">Identitas perusahaan</a><form action={logout}><button>Keluar</button></form></aside><main>{children}</main></div></>}
