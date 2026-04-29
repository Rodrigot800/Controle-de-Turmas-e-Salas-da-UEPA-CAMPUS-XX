import uepaLogo from '../assets/Assinatura_Padrão_CampusXX_Castanhal_Avatar_Horizontal_Cores.png'

function Header({ title, subtitle, children }) {

    return (
        <header className="header d-flex align-items-center">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="header-logo-container">
                        <img
                            src={uepaLogo}
                            alt="Logo UEPA"
                            className="header-logo"
                            style={{ display: 'block' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h1 style={{ margin: 0 }}>{title}</h1>
                        <span style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '4px' }}>{subtitle}</span>
                    </div>
                </div>
                
                {children && (
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        {children}
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header
