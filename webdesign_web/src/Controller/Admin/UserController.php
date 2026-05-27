<?php
// src/Controller/Admin/UserController.php

namespace App\Controller\Admin;

use App\Entity\Tenant\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/users', name: 'admin_users_')]
#[IsGranted('ROLE_ADMIN')]
class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
    ) {}

    #[Route('/', name: 'index')]
    public function index(): Response
    {
        $users = $this->em->getRepository(User::class)->findBy([], ['id' => 'DESC']);
        return $this->render('admin/users/index.html.twig', ['users' => $users]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request): Response
    {
        $error = null;

        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('user_new', $request->get('_csrf_token'))) {
                $error = 'Neplatný CSRF token.';
            } else {
                $existing = $this->em->getRepository(User::class)
                    ->findOneBy(['email' => $request->get('email')]);

                if ($existing) {
                    $error = 'Uživatel s tímto emailem již existuje.';
                } elseif (strlen($request->get('password')) < 6) {
                    $error = 'Heslo musí mít alespoň 6 znaků.';
                } else {
                    $user = new User();
                    $user->setEmail($request->get('email'));
                    $user->setName($request->get('name'));
                    $user->setRoles([$request->get('role', 'ROLE_USER')]);
                    $user->setPassword(
                        $this->passwordHasher->hashPassword($user, $request->get('password'))
                    );

                    $this->em->persist($user);
                    $this->em->flush();

                    $this->addFlash('success', 'Uživatel byl úspěšně vytvořen.');
                    return $this->redirectToRoute('admin_users_index');
                }
            }
        }

        return $this->render('admin/users/new.html.twig', ['error' => $error]);
    }

    #[Route('/{id}/edit', name: 'edit', methods: ['GET', 'POST'])]
    public function edit(int $id, Request $request): Response
    {
        $user = $this->em->getRepository(User::class)->find($id);
        if (!$user) throw $this->createNotFoundException();

        $error = null;

        if ($request->isMethod('POST')) {
            if (!$this->isCsrfTokenValid('user_edit_' . $id, $request->get('_csrf_token'))) {
                $error = 'Neplatný CSRF token.';
            } else {
                $user->setEmail($request->get('email'));
                $user->setName($request->get('name'));
                $user->setRoles([$request->get('role', 'ROLE_USER')]);

                if ($newPassword = $request->get('password')) {
                    if (strlen($newPassword) < 6) {
                        $error = 'Heslo musí mít alespoň 6 znaků.';
                    } else {
                        $user->setPassword(
                            $this->passwordHasher->hashPassword($user, $newPassword)
                        );
                    }
                }

                if (!$error) {
                    $this->em->flush();
                    $this->addFlash('success', 'Uživatel byl upraven.');
                    return $this->redirectToRoute('admin_users_index');
                }
            }
        }

        return $this->render('admin/users/edit.html.twig', [
            'user'  => $user,
            'error' => $error,
        ]);
    }

    #[Route('/{id}/delete', name: 'delete', methods: ['POST'])]
    public function delete(int $id, Request $request): Response
    {
        if (!$this->isCsrfTokenValid('user_delete_' . $id, $request->get('_csrf_token'))) {
            $this->addFlash('error', 'Neplatný CSRF token.');
            return $this->redirectToRoute('admin_users_index');
        }

        $user = $this->em->getRepository(User::class)->find($id);
        if (!$user) throw $this->createNotFoundException();

        if ($user->getUserIdentifier() === $this->getUser()->getUserIdentifier()) {
            $this->addFlash('error', 'Nemůžeš smazat vlastní účet.');
            return $this->redirectToRoute('admin_users_index');
        }

        $this->em->remove($user);
        $this->em->flush();

        $this->addFlash('success', 'Uživatel byl smazán.');
        return $this->redirectToRoute('admin_users_index');
    }

    #[Route('/{id}/toggle', name: 'toggle', methods: ['POST'])]
    public function toggle(int $id, Request $request): Response
    {
        if (!$this->isCsrfTokenValid('user_toggle_' . $id, $request->get('_csrf_token'))) {
            $this->addFlash('error', 'Neplatný CSRF token.');
            return $this->redirectToRoute('admin_users_index');
        }

        $user = $this->em->getRepository(User::class)->find($id);
        if (!$user) throw $this->createNotFoundException();

        $user->setActive(!$user->isActive());
        $this->em->flush();

        $status = $user->isActive() ? 'aktivován' : 'deaktivován';
        $this->addFlash('success', "Uživatel byl $status.");
        return $this->redirectToRoute('admin_users_index');
    }
}
