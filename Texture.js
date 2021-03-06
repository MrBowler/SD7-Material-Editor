var CreateTexture = function( imageFilePath )
{
    var texture = gl.createTexture();
    textureImage = new Image();
    textureImage.onload = function() { SetTextureGLVariables( texture, textureImage ); }
    textureImage.src = imageFilePath;
    
    return texture;
}


var SetTextureGLVariables = function( texture, image )
{
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.bindTexture( gl.TEXTURE_2D, null );
}