import uepaLogo from '../assets/Assinatura_Padrão_CampusXX_Castanhal_Avatar_Horizontal_Cores.png'

function Header({ title, subtitle }) {

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-content">
                    <img
                        src={uepaLogo}
                        alt="Logo UEPA"
                        className="header-logo"
                    />

            </div>

                <div>
                    <h1>{title}</h1>
                    <span>{subtitle}
                    </span>
                </div>
            </div>
        </header>
    )
}

export default Header
