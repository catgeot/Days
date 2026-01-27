// // src/Earth3D.jsx

// import React, { useMemo } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, Sphere, Stars, Points, PointMaterial } from '@react-three/drei';
// import * as random from 'maath/random/dist/maath-random.esm'; // 랜덤 위치 계산용 도구

// export default function Earth3D() {
//   return (
//     <div className="absolute inset-0 w-full h-full z-0">
//       <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
//         {/* 1. 조명 설정 */}
//         <ambientLight intensity={1.0} />
//         <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
        
//         {/* 2. 우주 배경 (별) */}
//         <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

//         {/* 3. 지구본 그룹 (본체 + 도시 불빛) */}
//         <group>
//           {/* A. 지구본 본체 (격자 무늬) */}
//           <Sphere args={[2.5, 64, 64]}> 
//             <meshStandardMaterial
//               color="#1e293b"     // 어두운 남색 (밤바다 색)
//               wireframe={true}    // 격자 무늬
//               transparent={true}
//               opacity={0.15}      // 아주 투명하게
//               emissive="#3b82f6"  // 파란색 빛을 뿜음
//               emissiveIntensity={0.5}
//             />
//           </Sphere>

//           {/* B. 도시 불빛 (반짝이는 점들) */}
//           {/* 지구 표면(반지름 2.5) 위에 점들을 뿌립니다 */}
//           <CityLights />
//         </group>

//         {/* 4. 마우스 컨트롤 */}
//         <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
//       </Canvas>
//     </div>
//   );
// }

// // 도시 불빛 컴포넌트 (따로 분리)
// function CityLights() {
//   // 랜덤한 점 1500개를 지구 표면(반지름 2.5) 위에 생성
//   const sphere = useMemo(() => random.inSphere(new Float32Array(1500), { radius: 2.5 }), []);

//   return (
//     <group rotation={[0, 0, Math.PI / 4]}>
//       <Points positions={sphere} stride={3} frustumCulled={false}>
//         <PointMaterial
//           transparent
//           color="#fbbf24"  // 노란색 (황금색 불빛)
//           size={0.03}      // 점 크기
//           sizeAttenuation={true}
//           depthWrite={false}
//         />
//       </Points>
//     </group>
//   );
// }