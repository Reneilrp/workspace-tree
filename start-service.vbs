Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' Check if port 7337 is already listening
Set oExec = WshShell.Exec("netstat -ano")
alreadyRunning = False
Do While Not oExec.StdOut.AtEndOfStream
    line = oExec.StdOut.ReadLine()
    If InStr(line, ":7337") > 0 And InStr(line, "LISTENING") > 0 Then
        alreadyRunning = True
        Exit Do
    End If
Loop

If Not alreadyRunning Then
    WshShell.Run "node """ & scriptDir & "\server.js""", 0, False
End If
