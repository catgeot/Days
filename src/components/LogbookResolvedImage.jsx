import React, { useEffect, useRef, useState } from 'react';
import { commonsOriginalFromThumbUrl } from '../utils/commonsSpecialFileThumb.js';

const LogbookResolvedImage = React.forwardRef(function LogbookResolvedImage(
  { src, onError, ...rest },
  ref,
) {
  const [current, setCurrent] = useState(src);
  const gaveUp = useRef(false);

  useEffect(() => {
    setCurrent(src);
    gaveUp.current = false;
  }, [src]);

  return (
    <img
      {...rest}
      ref={ref}
      src={current || undefined}
      onError={(event) => {
        if (gaveUp.current) return;
        const fallback = commonsOriginalFromThumbUrl(current);
        if (fallback && fallback !== current) {
          setCurrent(fallback);
          return;
        }
        gaveUp.current = true;
        onError?.(event);
      }}
    />
  );
});

export default LogbookResolvedImage;
