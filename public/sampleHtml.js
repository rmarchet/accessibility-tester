const sampleHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Sample page with accessibility problems</title>
</head>
<style>
  a {
    color: #fa9;
  }
</style>
<body>
  <header>
    <h4>Sample page with accessibility problems</h4>
    
  </header>
    <div style="background-color: #ffffff;">
        <img src="logo.png" />
        <h3>Welcome to our website</h3>
        <div style="color: #ccc;">
          This text has insufficient contrast
        </div>
        <button onclick="alert('clicked')">Click here</button>
        <div role="button">This is a fake button</div>
        <p>
            This is a paragraph with a <a href="#">link</a> inside it.
        </p>
        <table>
            <tr>
                <td>Name</td>
                <td>Email</td>
            </tr>
            <tr>
                <td>John Doe</td>
                <td>J.doe@example.com</td>
            </tr>
        </table>
    </div>
</body>
</html>`;