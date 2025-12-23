import { ArrowBarToLeft } from 'tabler-icons-react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';

const SidebarHeader = () => {
    const { states, dispatch } = useGlobalStateContext();

    const toggleSidebar = () => {
        dispatch({ type: 'sidebar_toggle' });
    }

    return (
        <div className="menu-header">
            <span>
                <Link className="navbar-brand" href="/">
                    {/* Small icon - always visible, shown in collapsed state */}
                    <Image 
                        className="brand-img img-fluid" 
                        src="/icon.png"
                        alt="Next Medya" 
                        width={36} 
                        height={36}
                        style={{ borderRadius: '8px' }}
                        priority
                    />
                    {/* Full logo - hidden when collapsed via CSS :last-child */}
                    <Image 
                        className="brand-img img-fluid" 
                        src="/logo.png"
                        alt="Next Medya" 
                        width={120} 
                        height={36}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </Link>
                <Button variant="flush-dark" onClick={toggleSidebar} className="btn-icon btn-rounded flush-soft-hover navbar-toggle">
                    <span className="icon">
                        <span className="svg-icon fs-5">
                            <ArrowBarToLeft />
                        </span>
                    </span>
                </Button>
            </span>
        </div>
    )
}

export default SidebarHeader




