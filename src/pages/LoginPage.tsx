// src/pages/LoginPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { supabase } from '../App';
import { useDispatch } from 'react-redux';
import { setSession, setRole } from '../store/authSlice';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Three.js сцена (без изменений)
  useEffect(() => {
    if (!containerRef.current) return;

    let controls: any;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let animationFrame: number;

    const initScene = async () => {
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050510);

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(15, 8, 25);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current?.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = true;
      controls.zoomSpeed = 1.5;
      controls.rotateSpeed = 0.8;
      controls.enablePan = true;
      controls.maxPolarAngle = Math.PI / 1.8;
      controls.minDistance = 8;
      controls.maxDistance = 60;
      controls.target.set(0, 1, 0);

      // Освещение
      const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
      sunLight.position.set(20, 25, 10);
      sunLight.castShadow = true;
      sunLight.receiveShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      const d = 25;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 80;
      sunLight.shadow.bias = -0.0005;
      scene.add(sunLight);

      scene.add(new THREE.AmbientLight(0x404c66, 0.65));
      const backLight = new THREE.DirectionalLight(0x99aacc, 0.35);
      backLight.position.set(-15, 10, -20);
      scene.add(backLight);
      const rimLight = new THREE.DirectionalLight(0xccddff, 0.25);
      rimLight.position.set(-5, 5, 25);
      scene.add(rimLight);

      // Галактика
      const galaxyGeo = new THREE.BufferGeometry();
      const count = 6000;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const innerColor = new THREE.Color(0xaaccff);
      const outerColor = new THREE.Color(0x5577aa);
      for (let i = 0; i < count; i++) {
        const radius = 50 + Math.random() * 80;
        const spin = radius * 0.03;
        const angle = (i % 400) * 0.06 + spin;
        const height = (Math.random() - 0.5) * 20 * Math.sin(radius * 0.05);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = height;
        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;
        const mixColor = innerColor.clone().lerp(outerColor, radius / 130);
        colors[i*3] = mixColor.r;
        colors[i*3+1] = mixColor.g;
        colors[i*3+2] = mixColor.b;
      }
      galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      galaxyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const galaxyMat = new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
      galaxy.rotation.x = 0.3;
      galaxy.rotation.y = 0.5;
      scene.add(galaxy);

      // Звёзды
      const starsGeo = new THREE.BufferGeometry();
      const starsCount = 5000;
      const starsPos = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount * 3; i += 3) {
        const r = 200 + Math.random() * 300;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        starsPos[i] = Math.sin(phi) * Math.cos(theta) * r;
        starsPos[i+1] = Math.sin(phi) * Math.sin(theta) * r;
        starsPos[i+2] = Math.cos(phi) * r;
      }
      starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
      const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true });
      const stars = new THREE.Points(starsGeo, starsMat);
      scene.add(stars);

      // Земля
      const earthGroup = new THREE.Group();
      const loader = new THREE.TextureLoader();
      const earthMap = loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
      const earthSpecularMap = loader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
      const earthNormalMap = loader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
      const cloudMap = loader.load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
      const earthMat = new THREE.MeshPhongMaterial({ map: earthMap, specularMap: earthSpecularMap, specular: new THREE.Color(0x333333), shininess: 10, normalMap: earthNormalMap, normalScale: new THREE.Vector2(1.5, 1.5) });
      const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(3.0, 64, 64), earthMat);
      earthMesh.castShadow = true; earthMesh.receiveShadow = true;
      earthGroup.add(earthMesh);
      const cloudMat = new THREE.MeshPhongMaterial({ map: cloudMap, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(3.03, 64, 64), cloudMat);
      earthGroup.add(cloudMesh);
      const atmosMat = new THREE.MeshPhongMaterial({ color: 0x88aacc, transparent: true, opacity: 0.18, side: THREE.BackSide, emissive: new THREE.Color(0x88aaff), emissiveIntensity: 0.4 });
      const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(3.2, 64, 64), atmosMat);
      earthGroup.add(atmosphere);
      earthGroup.position.set(-8, 1.5, -4);
      scene.add(earthGroup);

      // Спутник
      const satellite = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8, metalness: 0.05 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), bodyMat);
      body.castShadow = true; body.receiveShadow = true;
      satellite.add(body);
      const detailMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
      const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25), detailMat);
      cyl1.position.set(0.25, 0.35, 0.35); cyl1.rotation.x = 0.3; cyl1.castShadow = true;
      satellite.add(cyl1);
      const cyl2 = cyl1.clone();
      cyl2.position.set(-0.25, 0.35, -0.35); cyl2.rotation.x = -0.2;
      satellite.add(cyl2);
      const antennaMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 });
      const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4), antennaMat);
      antennaBase.position.set(0.35, 0.6, 0.25); antennaBase.rotation.z = 0.1; antennaBase.rotation.x = -0.2; antennaBase.castShadow = true;
      satellite.add(antennaBase);
      const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.07), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0x335577), emissiveIntensity: 0.3 }));
      antennaBall.position.set(0.55, 0.8, 0.4); antennaBall.castShadow = true;
      satellite.add(antennaBall);
      const createSolarPanel = (sign: number) => {
        const group = new THREE.Group();
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.9), frameMat);
        frame.castShadow = true; frame.receiveShadow = true;
        group.add(frame);
        const cellMat = new THREE.MeshStandardMaterial({ color: 0x99aacc, roughness: 0.8, emissive: new THREE.Color(0x224466), emissiveIntensity: 0.1 });
        const cellWidth = 0.4, cellDepth = 0.35, gap = 0.06;
        for (let i = -1; i <= 1; i+=2) {
          for (let j = -0.6; j <= 0.6; j+=0.6) {
            const cell = new THREE.Mesh(new THREE.BoxGeometry(cellWidth, 0.02, cellDepth), cellMat);
            cell.position.set(i * (cellWidth/2 + gap), 0.03, j * (cellDepth/2 + gap*0.5));
            cell.castShadow = true; cell.receiveShadow = true;
            group.add(cell);
          }
        }
        const armMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.6 });
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7), armMat);
        arm.rotation.z = Math.PI/2; arm.position.set(sign * 0.7, 0.0, 0); arm.castShadow = true; arm.receiveShadow = true;
        group.add(arm);
        group.position.set(sign * 1.2, 0.15, 0);
        return group;
      };
      satellite.add(createSolarPanel(-1));
      satellite.add(createSolarPanel(1));
      satellite.position.set(-4, 2.5, 1);
      satellite.rotation.y = 0.5; satellite.rotation.x = 0.1;
      scene.add(satellite);

      // Луна
      const moonMap = loader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg');
      const moon = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 32), new THREE.MeshStandardMaterial({ map: moonMap, roughness: 0.95 }));
      moon.castShadow = true; moon.receiveShadow = true;
      scene.add(moon);

      // Анимация
      const clock = new THREE.Clock();
      const animate = () => {
        const elapsedTime = performance.now() * 0.001;
        earthGroup.rotation.y += 0.001;
        (earthGroup.children[1] as THREE.Mesh).rotation.y += 0.0015;
        const earthPos = earthGroup.position;
        satellite.position.x = earthPos.x + Math.cos(elapsedTime * 0.15) * 8.0;
        satellite.position.z = earthPos.z + Math.sin(elapsedTime * 0.15) * 8.0 * 0.7;
        satellite.position.y = earthPos.y + 1.2 + Math.sin(elapsedTime * 0.6) * 0.6;
        satellite.rotation.y = elapsedTime * 0.12;
        satellite.rotation.x = 0.15 + Math.sin(elapsedTime * 0.2) * 0.05;
        moon.position.x = earthPos.x + Math.cos(elapsedTime * 0.05) * 12.0;
        moon.position.z = earthPos.z + Math.sin(elapsedTime * 0.05) * 12.0 * 0.8;
        moon.position.y = earthPos.y + 0.8 + Math.sin(elapsedTime * 0.1) * 0.4;
        moon.rotation.y += 0.002;
        galaxy.rotation.y += 0.0001;
        stars.rotation.y -= 0.00005;
        controls.update();
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    };

    initScene();

    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (renderer) {
        renderer.dispose();
        containerRef.current?.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        dispatch(setSession(data.session));
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
        dispatch(setRole(roleData?.role || 'engineer'));
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div ref={containerRef} id="canvas-container" />
      <div className="login-wrapper">
        <div className="login-panel">
          <h2>Sputnik Studio</h2>
          <div className="subtitle">проектирование AV-систем</div>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="input-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>
          <div className="login-footer">
            <span>Нет аккаунта? Обратитесь к администратору</span>
          </div>
        </div>
      </div>
    </div>
  );
};
