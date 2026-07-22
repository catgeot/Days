import logo from '../../../assets/gateo_logo1.png';

const SIZE_CLASS = {
  header: 'h-11 md:h-14',
  panel: 'h-12 md:h-14',
  /** 숙소 패널 고정 헤더 */
  stay: 'h-9',
};

function Logo({ size = 'header', className = '' }) {
  return (
    <img
      src={logo}
      alt="GATEO"
      className={`w-auto max-w-none object-contain object-left ${SIZE_CLASS[size] ?? SIZE_CLASS.header} ${className}`}
      draggable={false}
    />
  );
}

export default Logo;
