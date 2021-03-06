#version 100
// Fragment Shader, GLSL v1.00

precision mediump float;

// INPUTS
uniform sampler2D u_diffuseTexture;
varying vec4 a_screenPosition;
varying vec4 a_worldPosition;
varying vec2 a_textureCoordinates;
varying vec4 a_surfaceColor;
varying vec4 a_surfaceTangent;
varying vec3 a_surfaceBitangnet;

// OUTPUTS
//out vec4 a_fragColor;


//-----------------------------------------------------------------------------------------------
void main()
{
	vec4 diffuseTexel = texture2D( u_diffuseTexture, a_textureCoordinates );
	gl_FragColor = ( diffuseTexel * a_surfaceColor );
}