import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Loose Ends — Where things stand',description:'Your household remembers, so you don’t have to explain everything twice.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
