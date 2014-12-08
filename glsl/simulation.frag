#ifdef GL_ES
precision mediump float;
#endif


#define DIM 1024.0
#define dT 0.07
uniform sampler2D state;
uniform sampler2D obstacleState;
uniform sampler2D obstacleLevelset;
uniform vec2 scale;
uniform float seed;
uniform float nSphere;

//
// Description : Array and textureless GLSL 2D/3D/4D simplex 
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
  }

  ///////////////////////////

vec4 shift(vec4 pos)
{
	return vec4(2.0*(pos.xyz - vec3(0.5)),1.0);
}

vec4 shiftBack(vec4 pos)
{
	return vec4(0.5*pos.xyz + vec3(0.5), 1.0);
}

void main() {

	vec2 SUV = gl_FragCoord.xy;

	float type = mod(SUV.x,4.0);


	vec4 newValue = texture2D(state, SUV/DIM);
	vec4 sphereState = texture2D(obstacleState,vec2(0.0,0.0));

	//if position
	if(type<1.5)
	{
	    vec4 oldPos = texture2D(state, SUV/DIM) ;
		//vec3 spherePos = sphereState.xyz;
		//float sphereR = sphereState.w;

		/*
		if(length(oldPos.xyz - spherePos) < sphereR)
		{
			newValue = vec4(normalize(oldPos.xyz - spherePos) * (sphereR-length(oldPos.xyz-spherePos)) * 1.1 + oldPos.xyz,1.0);
		} 
		else newValue = oldPos + dT * shift(texture2D(state, vec2(SUV.x + 1.0,SUV.y)/DIM));*/


		newValue = oldPos + dT * shift(texture2D(state, vec2(SUV.x + 1.0,SUV.y)/DIM));

		/*if(newValue.y <= 0.0 || newValue.y >= 1.0||newValue.z >= 1.0 || newValue.z <= 0.0 ||newValue.x >= 1.0 ||newValue.x <= 0.0)
		{
			newValue.y += 1.0;
			newValue.x = gl_FragCoord.x/DIM;
			newValue.z = 0.5;
		}*/	
	}

	//if velocity
	else if(type<2.5)
	{
		vec4 oldPos = texture2D(state,  vec2(SUV.x - 1.0,SUV.y)/DIM) ;
		vec4 oldVel = texture2D(state,  SUV/DIM) ;
		vec3 spherePos;
		float sphereR;

		
		
		//New Collision system
		spherePos = texture2D(obstacleLevelset,oldPos.xy).xyz;
		sphereR = texture2D(obstacleLevelset,oldPos.xy).w;

		if(sphereR< 0.001 || length(oldPos.xyz - spherePos) > sphereR) newValue = oldVel +  vec4(dT *vec3(0.000,-0.05,0.000),1.0);
		else
		{

			vec3 sphereNorm = normalize(oldPos.xyz - spherePos);
			sphereNorm.x += 0.5 * snoise(vec3(seed * gl_FragCoord.y));
			sphereNorm.y += 0.5 * snoise(vec3(seed * gl_FragCoord.x));
			sphereNorm.z += 0.5 * snoise(vec3(seed * gl_FragCoord.z));
			sphereNorm = normalize(sphereNorm);
		

			vec3 ref = -normalize(reflect(normalize(oldVel.xyz),sphereNorm));
			if(dot(ref,sphereNorm)<0.0001) ref = normalize(ref + sphereNorm);
		
			float randResistance = (snoise(gl_FragCoord.xyz) + 1.0) * 0.06;
			float resistance = randResistance + 0.035;
			newValue = shiftBack(vec4(ref * length(oldVel) *resistance, 1.0)) +  vec4(dT *vec3(0.000,-0.05,0.000),1.0);
			
		}
		
		
		//Old Collision system
		/*for(float i = 0.0; i < DIM; i++)
		{
		    sphereState = texture2D(obstacleState, vec2(0.0,i/DIM));
			spherePos = sphereState.xyz;
			sphereR = sphereState.w;

			if(sphereR < 0.001)	break;

			vec3 sphereNorm = normalize(oldPos.xyz - spherePos);
			sphereNorm.x += 0.5 * snoise(vec3(seed * gl_FragCoord.y));
			sphereNorm.y += 0.5 * snoise(vec3(seed * gl_FragCoord.x));
			sphereNorm.z += 0.5 * snoise(vec3(seed * gl_FragCoord.z));
			sphereNorm = normalize(sphereNorm);
		

			vec3 ref = -normalize(reflect(normalize(oldVel.xyz),sphereNorm));
			if(dot(ref,sphereNorm)<0.0001) ref = normalize(ref + sphereNorm);
			if(length(oldPos.xyz - spherePos) < sphereR )
			{
				float randResistance = (snoise(gl_FragCoord.xyz) + 1.0) * 0.05;
				float resistance = randResistance + 0.03;
				newValue = shiftBack(vec4(ref * length(oldVel) *resistance, 1.0));
				break;
			}
			else newValue = oldVel +  vec4(dT *vec3(0.000,-0.05,0.000),1.0);
		}*/
		
		

        newValue = vec4(clamp(newValue.xyz, vec3(0.4),vec3(0.6)),1.0);
	}

	//if color
	else if(type<3.5)
	{
		//newValue = texture2D(state, SUV/DIM) + vec4(0.1,0.1,0.1,1.0);
	}

	//if else (size and etc.)
	else if(type<4.5)
	{
		//newValue = texture2D(state, SUV/DIM) + vec4(0.3,0.2,0.2,1.0);
	}
	gl_FragColor = vec4(newValue);
}
