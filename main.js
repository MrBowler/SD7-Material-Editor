//----------------------------------------------------------------------------------------------------------
const FRAMES_PER_SECOND = 60;
const FRAME_TIME_SECONDS = 1.0 / FRAMES_PER_SECOND;
const VERTEX_ATTRIB_POSITIONS = 0;
const VERTEX_ATTRIB_COLORS = 1;
const VERTEX_ATTRIB_TEX_COORDS = 2;
const VERTEX_ATTRIB_NORMALS = 3;
const VERTEX_ATTRIB_TANGENT = 4;
const CUBE_X_AXIS_HALF_LENGTH = 0.5;
const CUBE_Y_AXIS_HALF_LENGTH = 0.5;
const CUBE_Z_AXIS_HALF_LENGTH = 0.5;


//----------------------------------------------------------------------------------------------------------
var gl = null;
var objCanvas = null;
var diffuseCanvas = null;
var normalCanvas = null;
var specularCanvas = null;
var emissiveCanvas = null;
var objFileReader = null;
var diffuseFileReader = null;
var normalFileReader = null;
var specularFileReader = null;
var emissiveFileReader = null;
var shaderProgram = null;
var diffuseTexture = null;
var normalTexture = null;
var specularTexture = null;
var emissiveTexture = null;
var isUsingDiffuse = false;
var isUsingNormal = false;
var isUsingSpecular = false;
var isUsingEmissive = false;
var topMatrix = null;
var matrixStack = [];
var fileText = "";
var vertexShaderFileName = "Shaders/Normal_Map_100.vertex.glsl";
var fragmentShaderFileName = "Shaders/Normal_Map_100.fragment.glsl";
var vbo = null;
var meshModel = new Mesh3D();
var worldCamera = new Camera();
var light = new Light();


//----------------------------------------------------------------------------------------------------------
var PushMatrix = function()
{
    var newTopMatrix = mat4.create( topMatrix );
    matrixStack.push( newTopMatrix );
    topMatrix = newTopMatrix;
}


//----------------------------------------------------------------------------------------------------------
var PopMatrix = function()
{
    if( matrixStack.length > 1 )
    {
        matrixStack.pop();
        topMatrix = matrixStack[ matrixStack.length - 1 ];
    }
}


//----------------------------------------------------------------------------------------------------------
var OnLoadObj = function( event )
{
    meshModel = Mesh3D.GetMeshFromFile( event.target.result );
    LoadMesh( meshModel );
}


//----------------------------------------------------------------------------------------------------------
var OnLoadDiffuseImg = function( event )
{
    diffuseTexture = CreateTexture( event.target.result );
    var ctx = diffuseCanvas.getContext( "2d" );
    var img = document.getElementById( "diffuseTexture" );
    img.src = event.target.result;
    ctx.drawImage( img, 0, 0, diffuseCanvas.width, diffuseCanvas.height );
}


//----------------------------------------------------------------------------------------------------------
var OnLoadNormalImg = function( event )
{
    normalTexture = CreateTexture( event.target.result );
    var ctx = normalCanvas.getContext( "2d" );
    var img = document.getElementById( "normalTexture" );
    img.src = event.target.result;
    ctx.drawImage( img, 0, 0, normalCanvas.width, normalCanvas.height );
}


//----------------------------------------------------------------------------------------------------------
var OnLoadSpecularImg = function( event )
{
    specularTexture = CreateTexture( event.target.result );
    var ctx = specularCanvas.getContext( "2d" );
    var img = document.getElementById( "specularTexture" );
    img.src = event.target.result;
    ctx.drawImage( img, 0, 0, specularCanvas.width, specularCanvas.height );
}


//----------------------------------------------------------------------------------------------------------
var OnLoadEmissiveImg = function( event )
{
    emissiveTexture = CreateTexture( event.target.result );
    var ctx = emissiveCanvas.getContext( "2d" );
    var img = document.getElementById( "emissiveTexture" );
    img.src = event.target.result;
    ctx.drawImage( img, 0, 0, emissiveCanvas.width, emissiveCanvas.height );
}


//----------------------------------------------------------------------------------------------------------
var OnDragOver = function( event )
{
    event.preventDefault();
}


//----------------------------------------------------------------------------------------------------------
var OnDropObj = function( event )
{
    var givenFiles = event.dataTransfer.files;
    if( givenFiles.length > 0 )
    {
        var file = givenFiles[0];
        if( file.name.lastIndexOf( ".obj" ) == file.name.length - 4 ) // ensure that this is an .obj file
        {
            objFileReader.readAsText( file );
        }
    }
    
    event.preventDefault();
}


//----------------------------------------------------------------------------------------------------------
var OnDropDiffuse = function( event )
{
    var givenFiles = event.dataTransfer.files;
    if( givenFiles.length > 0 )
    {
        var file = givenFiles[0];
        diffuseFileReader.readAsDataURL( file );
    }
    
    event.preventDefault();
}


//----------------------------------------------------------------------------------------------------------
var OnDropNormal = function( event )
{
    var givenFiles = event.dataTransfer.files;
    if( givenFiles.length > 0 )
    {
        var file = givenFiles[0];
        normalFileReader.readAsDataURL( file );
    }
    
    event.preventDefault();
}


//----------------------------------------------------------------------------------------------------------
var OnDropSpecular = function( event )
{
    var givenFiles = event.dataTransfer.files;
    if( givenFiles.length > 0 )
    {
        var file = givenFiles[0];
        specularFileReader.readAsDataURL( file );
    }
    
    event.preventDefault();
}


//----------------------------------------------------------------------------------------------------------
var OnDropEmissive = function( event )
{
    var givenFiles = event.dataTransfer.files;
    if( givenFiles.length > 0 )
    {
        var file = givenFiles[0];
        emissiveFileReader.readAsDataURL( file );
    }
    
    event.preventDefault();
}


//----------------------------------------------------------------------------------------------------------
var GetShader = function( shaderType, shaderSource )
{
    var shader = gl.createShader( shaderType );
    if( !shader )
    {
        console.log( "Failed to create shader of type " + shaderType );
        alert( "Failed to create shader of type " + shaderType );
        return null;
    }
    
    gl.shaderSource( shader, shaderSource );
    gl.compileShader( shader );
    if( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
    {
        console.log( gl.getShaderInfoLog( shader ) );
        alert( gl.getShaderInfoLog( shader ) );
        return null;
    }
    
    return shader;
}


//----------------------------------------------------------------------------------------------------------
var InitalizeFileReader = function()
{
    if( !window.File || !window.FileReader || !window.FileList || !window.Blob )
    {
        alert( "Failed to load file reader. You won't be able to load files." );
        fileReader = null;
        return;
    }
    
    objFileReader = new window.FileReader();
    objFileReader.onload = OnLoadObj;
    
    diffuseFileReader = new window.FileReader();
    diffuseFileReader.onload = OnLoadDiffuseImg;
    
    normalFileReader = new window.FileReader();
    normalFileReader.onload = OnLoadNormalImg;
    
    specularFileReader = new window.FileReader();
    specularFileReader.onload = OnLoadSpecularImg;
    
    emissiveFileReader = new window.FileReader();
    emissiveFileReader.onload = OnLoadEmissiveImg;
}


//----------------------------------------------------------------------------------------------------------
var InitalizeWebGL = function( canvas )
{
    var testWebGL = null;
    
    try
    {
        testWebGL = canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" );
    }
    catch(e) {}
    
    if( !testWebGL )
    {
        alert( "Unable to initialize WebGL. Your browser may not support it." );
        window.location = "http://get.webgl.org";
        testWebGL = null;
    }
    
    return testWebGL;
}


//----------------------------------------------------------------------------------------------------------
var InitalizeCanvas = function()
{
    objCanvas = document.getElementById( "objCanvas" );
    objCanvas.addEventListener( "dragover", OnDragOver, false );
    objCanvas.addEventListener("drop", OnDropObj, false );
    
    diffuseCanvas = document.getElementById( "diffuseCanvas" );
    diffuseCanvas.addEventListener( "dragover", OnDragOver, false );
    diffuseCanvas.addEventListener( "drop", OnDropDiffuse, false );
    
    normalCanvas = document.getElementById( "normalCanvas" );
    normalCanvas.addEventListener( "dragover", OnDragOver, false );
    normalCanvas.addEventListener( "drop", OnDropNormal, false );
    
    specularCanvas = document.getElementById( "specularCanvas" );
    specularCanvas.addEventListener( "dragover", OnDragOver, false );
    specularCanvas.addEventListener( "drop", OnDropSpecular, false );
    
    emissiveCanvas = document.getElementById( "emissiveCanvas" );
    emissiveCanvas.addEventListener( "dragover", OnDragOver, false );
    emissiveCanvas.addEventListener( "drop", OnDropEmissive, false );
    
    gl = InitalizeWebGL( objCanvas );
    if( gl )
    {
        gl.enable( gl.BLEND );
        gl.enable( gl.DEPTH_TEST );
        gl.enable( gl.CULL_FACE );
        gl.frontFace( gl.CCW );
        gl.depthFunc( gl.LEQUAL );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        gl.viewport( 0, 0, objCanvas.clientWidth, objCanvas.clientHeight );
    }
}


//----------------------------------------------------------------------------------------------------------
var InitalizeShaders = function()
{
    var vertexShader = GetShader( gl.VERTEX_SHADER, GetFileText( vertexShaderFileName ) );
    var fragmentShader = GetShader( gl.FRAGMENT_SHADER, GetFileText( fragmentShaderFileName ) );
    
    if( !vertexShader || !fragmentShader )
    {
        return;
    }
    
    shaderProgram = gl.createProgram();
    gl.attachShader( shaderProgram, vertexShader );
    gl.attachShader( shaderProgram, fragmentShader );
    
    gl.bindAttribLocation( shaderProgram, VERTEX_ATTRIB_POSITIONS, "a_vertex" );
    gl.bindAttribLocation( shaderProgram, VERTEX_ATTRIB_COLORS, "a_color" );
    gl.bindAttribLocation( shaderProgram, VERTEX_ATTRIB_TEX_COORDS, "a_texCoords" );
    gl.bindAttribLocation( shaderProgram, VERTEX_ATTRIB_NORMALS, "a_normal" );
    gl.bindAttribLocation( shaderProgram, VERTEX_ATTRIB_TANGENT, "a_tangent" );
    
    gl.linkProgram( shaderProgram );
    if( !gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) )
    {
        console.log( gl.getProgramInfoLog( shaderProgram ) );
        alert( gl.getProgramInfoLog( shaderProgram ) );
        return;
    }
    
    gl.useProgram( shaderProgram );
}


//----------------------------------------------------------------------------------------------------------
var InitalizeTextures = function()
{
    
}


//----------------------------------------------------------------------------------------------------------
var InitalizeLights = function()
{
    //light.position.z = 10.0;
    light.direction.x = 1.0;
    light.direction.y = -1.0;
    light.direction.z = -1.0;
    light.isPositionless = true;
}


//----------------------------------------------------------------------------------------------------------
var Initalize = function()
{
    InitalizeFileReader();
    InitalizeCanvas();
    InitalizeShaders();
    InitalizeTextures();
    InitalizeLights();
    worldCamera.position.x = -75.0;
    topMatrix = mat4.create();
    mat4.identity( topMatrix );
    matrixStack.push( topMatrix );
}


//----------------------------------------------------------------------------------------------------------
var GetFileText = function( fileName )
{
    var xhr = new XMLHttpRequest();
    xhr.open( 'get', fileName, false );
    xhr.send();
    return xhr.responseText;
}


//----------------------------------------------------------------------------------------------------------
var GetConvertedVertices = function( vertices )
{
    var convertedVerts = [];
    
    for( var vertIndex = 0; vertIndex < vertices.length; ++vertIndex )
    {
        var floatIndex = vertIndex * VERTEX_SIZE;
        var vert = vertices[ vertIndex ];
        
        // add position
        convertedVerts.push( vert.position.x );
        convertedVerts.push( vert.position.y );
        convertedVerts.push( vert.position.z );
        
        // add color
        convertedVerts.push( vert.color.r );
        convertedVerts.push( vert.color.g );
        convertedVerts.push( vert.color.b );
        convertedVerts.push( vert.color.a );
        
        // add texture coordinates
        convertedVerts.push( vert.texCoords.x );
        convertedVerts.push( vert.texCoords.y );
        
        // add normals
        convertedVerts.push( vert.normal.x );
        convertedVerts.push( vert.normal.y );
        convertedVerts.push( vert.normal.z );
        
        // add tangents
        convertedVerts.push( vert.tangent.x );
        convertedVerts.push( vert.tangent.y );
        convertedVerts.push( vert.tangent.z );
    }
    
    return new Float32Array( convertedVerts );
}


//----------------------------------------------------------------------------------------------------------
var LoadMesh = function( mesh )
{
    if( mesh.vertices.length === 0 )
    {
        console.log( "WARNING: This mesh has no vertices and will not be loaded" );
        return;
    }
    
    var convertedVerts = GetConvertedVertices( mesh.vertices );
    
    vbo = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vbo );
    gl.bufferData( gl.ARRAY_BUFFER, convertedVerts, gl.STATIC_DRAW );
    
    gl.enableVertexAttribArray( VERTEX_ATTRIB_POSITIONS );
    gl.enableVertexAttribArray( VERTEX_ATTRIB_COLORS );
    gl.enableVertexAttribArray( VERTEX_ATTRIB_TEX_COORDS );
    gl.enableVertexAttribArray( VERTEX_ATTRIB_NORMALS );
    gl.enableVertexAttribArray( VERTEX_ATTRIB_TANGENT );
    
    gl.vertexAttribPointer( VERTEX_ATTRIB_POSITIONS, POSITION_SIZE, gl.FLOAT, false, VERTEX_SIZE, POSITION_OFFSET );
    gl.vertexAttribPointer( VERTEX_ATTRIB_COLORS, COLOR_SIZE, gl.FLOAT, false, VERTEX_SIZE, COLOR_OFFSET );
    gl.vertexAttribPointer( VERTEX_ATTRIB_TEX_COORDS, TEX_COORD_SIZE, gl.FLOAT, false, VERTEX_SIZE, TEX_COORD_OFFSET );
    gl.vertexAttribPointer( VERTEX_ATTRIB_NORMALS, NORMAL_SIZE, gl.FLOAT, false, VERTEX_SIZE, NORMAL_OFFSET );
    gl.vertexAttribPointer( VERTEX_ATTRIB_TANGENT, TANGENT_SIZE, gl.FLOAT, false, VERTEX_SIZE, TANGENT_OFFSET );
}


//----------------------------------------------------------------------------------------------------------
var BindTexture = function( texture, textureLayer, textureLayerNum, uniformName, usingCheckName )
{
    if( texture )
    {
        gl.activeTexture( textureLayer );
        gl.bindTexture( gl.TEXTURE_2D, texture );
        gl.uniform1i( gl.getUniformLocation( shaderProgram, uniformName ), textureLayerNum );
        gl.uniform1i( gl.getUniformLocation( shaderProgram, usingCheckName ), 1 );
    }
    else
    {
        gl.activeTexture( textureLayer );
        gl.bindTexture( gl.TEXTURE_2D, null );
        gl.uniform1i( gl.getUniformLocation( shaderProgram, usingCheckName ), 0 );
    }
}


//----------------------------------------------------------------------------------------------------------
var BindLight = function()
{
    gl.uniform3f( gl.getUniformLocation( shaderProgram, 'u_light.m_position' ), light.position.x, light.position.y, light.position.z );
    gl.uniform3f( gl.getUniformLocation( shaderProgram, 'u_light.m_position' ), light.direction.x, light.direction.y, light.direction.z );
    gl.uniform4f( gl.getUniformLocation( shaderProgram, 'u_light.m_color' ), light.color.r, light.color.g, light.color.b, light.color.a );
    gl.uniform1f( gl.getUniformLocation( shaderProgram, 'u_light.m_innerRadius' ), light.innerRadius );
    gl.uniform1f( gl.getUniformLocation( shaderProgram, 'u_light.m_outerRadius' ), light.outerRadius );
    gl.uniform1f( gl.getUniformLocation( shaderProgram, 'u_light.m_innerApertureDot' ), light.innerApertureDot );
    gl.uniform1f( gl.getUniformLocation( shaderProgram, 'u_light.m_outerApertureDot' ), light.outerApertureDot );
    gl.uniform1f( gl.getUniformLocation( shaderProgram, 'u_light.m_fractionAmbient' ), light.fractionAmbient );
    gl.uniform1i( gl.getUniformLocation( shaderProgram, 'u_light.m_isPositionless' ), light.isPositionless );
}


//----------------------------------------------------------------------------------------------------------
var SetCameraPositionAndOrientation = function( camera )
{
    mat4.rotate( topMatrix, ConvertDegToRad( -90.0 ), [ 1.0, 0.0, 0.0 ] );
    mat4.rotate( topMatrix, ConvertDegToRad( 90.0 ), [ 0.0, 0.0, 1.0 ] );
    
    mat4.rotate( topMatrix, ConvertDegToRad( camera.orientation.roll ), [ 1.0, 0.0, 0.0 ] );
    mat4.rotate( topMatrix, ConvertDegToRad( camera.orientation.pitch ), [ 0.0, 1.0, 0.0 ] );
    mat4.rotate( topMatrix, ConvertDegToRad( camera.orientation.yaw ), [ 0.0, 0.0, 1.0 ] );
    
    mat4.translate( topMatrix, [ -camera.position.x, -camera.position.y, -camera.position.z ] );
}


//----------------------------------------------------------------------------------------------------------
var Render3D = function()
{
    PushMatrix();
    
    gl.enable( gl.DEPTH_TEST );
    mat4.perspective( 45.0, objCanvas.clientWidth / objCanvas.clientHeight, 0.1, 1000.0, topMatrix );
    SetCameraPositionAndOrientation( worldCamera );
    
    PushMatrix();
    
    mat4.rotate( topMatrix, ConvertDegToRad( meshModel.rotation.yaw ), [ 0.0, 0.0, 1.0 ] );
    mat4.rotate( topMatrix, ConvertDegToRad( meshModel.rotation.pitch ), [ 1.0, 0.0, 0.0 ] );
    
    mat4.rotate( topMatrix, ConvertDegToRad( -90.0 ), [ 0.0, 0.0, 1.0 ] );
    mat4.rotate( topMatrix, ConvertDegToRad( 90.0 ), [ 1.0, 0.0, 0.0 ] );
    
    mat4.scale( topMatrix, [ meshModel.scale, meshModel.scale, meshModel.scale ] );
    

    BindTexture( diffuseTexture, gl.TEXTURE0, 0, "u_diffuseTexture", "u_isUsingDiffuse" );
    BindTexture( normalTexture, gl.TEXTURE1, 1, "u_normalTexture", "u_isUsingNormal" );
    BindTexture( specularTexture, gl.TEXTURE2, 2, "u_specularTexture", "u_isUsingSpecular" );
    BindTexture( emissiveTexture, gl.TEXTURE3, 3, "u_emissiveTexture", "u_isUsingEmissive" );
    
    BindLight();
    
    gl.uniformMatrix4fv( gl.getUniformLocation( shaderProgram, 'u_modelViewProjectionMatrix' ), false, topMatrix );
    gl.drawArrays( gl.TRIANGLES, 0, meshModel.vertices.length );
    
    PopMatrix();
    
    PopMatrix();
}


//----------------------------------------------------------------------------------------------------------
var Update = function()
{
    if( mouse.isLeftPressed )
    {
        meshModel.rotation.yaw += 0.1 * ( mouse.lastX - mouse.currentX );
        meshModel.rotation.pitch += Math.sin( ConvertDegToRad( meshModel.rotation.yaw ) ) * 0.1 * ( mouse.lastY - mouse.currentY );
        meshModel.rotation.roll += Math.cos( ConvertDegToRad( meshModel.rotation.yaw ) ) * 0.1 * ( mouse.lastY - mouse.currentY );
    }
    else if( mouse.isRightPressed )
    {
        meshModel.scale += 0.05 * ( mouse.lastY - mouse.currentY );
        if( meshModel.scale < 0.05 )
        {
            meshModel.scale = 0.05;
        }
    }
	
	mouse.lastX = mouse.currentX;
	mouse.lastY = mouse.currentY;
}


//----------------------------------------------------------------------------------------------------------
var Render = function()
{
    gl.clearColor( 0.0, 0.4, 0.6, 1.0 );
    gl.clearDepth( 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    Render3D();
}


//----------------------------------------------------------------------------------------------------------
var RunFrame = function()
{
    Update();
    Render();
    setTimeout( RunFrame, FRAME_TIME_SECONDS );
}


//----------------------------------------------------------------------------------------------------------
var main = function()
{
    Initalize();
    RunFrame();
}
